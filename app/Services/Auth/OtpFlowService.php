<?php

namespace App\Services\Auth;

use App\Contracts\Auth\OtpFlowServiceInterface;
use App\Contracts\Auth\OtpServiceInterface;
use App\Enums\OtpChannelEnum;
use App\Enums\OtpTypeEnum;
use App\Enums\UserRoleEnum;
use App\Enums\UserStatusEnum;
use App\Exceptions\Auth\OtpException;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Traits\IssuesTokens;
use Illuminate\Contracts\Config\Repository as Config;
use Illuminate\Support\Facades\DB;

/**
 * Owns every send-otp / verify-otp side-effect — eligibility checks, token
 * issuance, mobile / email mutation. Controllers stay thin and routes stay
 * collapsed to a single send + verify pair.
 */
class OtpFlowService implements OtpFlowServiceInterface
{
    use IssuesTokens;

    public function __construct(
        protected OtpServiceInterface $otp,
        protected UserRepositoryInterface $users,
        protected Config $config,
    ) {
    }

    public function send(
        OtpTypeEnum $type,
        OtpChannelEnum $channel,
        string $target,
        ?UserRoleEnum $userType = null,
        ?User $authUser = null,
        ?string $countryCode = null,
    ): array {
        $this->assertAuthContext($type, $authUser);
        $this->assertTargetNotSoftDeleted($target);
        $this->assertEligibleToSend($type, $channel, $target, $userType, $authUser);

        $this->otp->send($target, $channel);

        return $this->envelope($target);
    }

    public function verify(
        OtpTypeEnum $type,
        OtpChannelEnum $channel,
        string $target,
        string $code,
        ?UserRoleEnum $userType = null,
        ?User $authUser = null,
        ?string $countryCode = null,
    ): array {
        $this->assertAuthContext($type, $authUser);
        $this->assertTargetNotSoftDeleted($target);

        // Re-run the send-time eligibility checks so a stale OTP can't be
        // used to e.g. log into a suspended account or claim an identifier
        // that has since been registered to someone else.
        $this->assertEligibleToSend($type, $channel, $target, $userType, $authUser);

        $this->otp->verifyOrFail($target, $code);

        return match ($type) {
            OtpTypeEnum::LOGIN => $this->completeLogin($target, $userType),
            OtpTypeEnum::SIGNUP => $this->completeSignup($target),
            OtpTypeEnum::UPDATE_PHONE => $this->completePhoneUpdate($authUser, $target, $countryCode),
            OtpTypeEnum::UPDATE_EMAIL => $this->completeEmailUpdate($authUser, $target),
            OtpTypeEnum::VERIFY_CURRENT_PHONE,
            OtpTypeEnum::VERIFY_CURRENT_EMAIL => $this->completeCurrentVerification($authUser, $type),
        };
    }

    /**
     * Step 1 verify — no mutation, just hand back a confirmation flag so
     * the client knows it can advance to the "enter new identifier" step.
     */
    protected function completeCurrentVerification(User $authUser, OtpTypeEnum $type): array
    {
        return [
            'verified' => true,
            'type' => $type->value,
            'user' => new UserResource($authUser->loadProfileRelation()),
        ];
    }

    protected function assertAuthContext(OtpTypeEnum $type, ?User $authUser): void
    {
        if ($type->requiresAuth() && ! $authUser) {
            throw OtpException::authRequired();
        }
    }

    /**
     * Refuse to engage with credentials that match a soft-deleted user.
     * Without this check, login would report "no account exists" and
     * signup would happily send an OTP — only to fail at the unique-index
     * step. Surfacing it here gives the app a single, clear error to act
     * on so the user knows to contact admin.
     */
    protected function assertTargetNotSoftDeleted(string $target): void
    {
        $existing = $this->users->findAnyByMobileOrEmail($target);

        if ($existing && $existing->trashed()) {
            throw OtpException::accountDeleted($this->roleLabel($existing));
        }
    }

    /**
     * Spatie roles still resolve on a soft-deleted user, so we surface the
     * primary role in the error message ("customer", "driver", ...). The
     * restaurant_owner role gets a friendlier "restaurant" label.
     */
    protected function roleLabel(User $user): ?string
    {
        $role = $user->getRoleNames()->first();

        if (! $role) {
            return null;
        }

        return $role === UserRoleEnum::RESTAURANT_OWNER->value ? 'restaurant' : $role;
    }

    /**
     * Centralised eligibility checks shared by send + verify. Each branch
     * throws an OtpException so the controller never needs to know about
     * the underlying error cases.
     */
    protected function assertEligibleToSend(
        OtpTypeEnum $type,
        OtpChannelEnum $channel,
        string $target,
        ?UserRoleEnum $userType,
        ?User $authUser,
    ): void {
        match ($type) {
            OtpTypeEnum::LOGIN => $this->assertLoginEligible($channel, $target, $userType),
            OtpTypeEnum::SIGNUP => $this->assertSignupEligible($channel, $target),
            OtpTypeEnum::UPDATE_PHONE => $this->assertPhoneUpdateEligible($authUser, $target),
            OtpTypeEnum::UPDATE_EMAIL => $this->assertEmailUpdateEligible($authUser, $target),
            OtpTypeEnum::VERIFY_CURRENT_PHONE => $this->assertCurrentPhoneTarget($authUser, $target),
            OtpTypeEnum::VERIFY_CURRENT_EMAIL => $this->assertCurrentEmailTarget($authUser, $target),
        };
    }

    /**
     * Step 1 of the change-phone flow: the submitted target must match the
     * authenticated user's existing mobile number. Stops an attacker from
     * using the verify-current endpoint to fish OTPs to arbitrary numbers.
     */
    protected function assertCurrentPhoneTarget(User $authUser, string $target): void
    {
        // mobile is stored as the subscriber-only digits; country_code holds
        // the dialling prefix. Compare against the glued-together canonical
        // form so an incoming "+44…" target still matches.
        if (empty($authUser->canonical_mobile) || $authUser->canonical_mobile !== $target) {
            throw OtpException::targetNotCurrent('mobile');
        }
    }

    protected function assertCurrentEmailTarget(User $authUser, string $target): void
    {
        if (empty($authUser->email) || $authUser->email !== $target) {
            throw OtpException::targetNotCurrent('email');
        }
    }

    protected function assertLoginEligible(OtpChannelEnum $channel, string $target, ?UserRoleEnum $userType): void
    {
        $user = $this->findUserByChannel($channel, $target);

        if (! $user) {
            throw OtpException::userNotRegistered();
        }

        $this->assertUserUsable($user);

        if ($userType && ! $user->hasRole($userType->value)) {
            throw OtpException::roleMismatch($userType->value);
        }
    }

    protected function assertSignupEligible(OtpChannelEnum $channel, string $target): void
    {
        if ($this->findUserByChannel($channel, $target)) {
            throw OtpException::userAlreadyExists();
        }
    }

    protected function assertPhoneUpdateEligible(User $authUser, string $newMobile): void
    {
        $existing = $this->users->findByMobile($newMobile);

        if ($existing && $existing->id !== $authUser->id) {
            throw OtpException::userAlreadyExists();
        }
    }

    protected function assertEmailUpdateEligible(User $authUser, string $newEmail): void
    {
        $existing = $this->users->findByEmail($newEmail);

        if ($existing && $existing->id !== $authUser->id) {
            throw OtpException::userAlreadyExists();
        }
    }

    protected function assertUserUsable(User $user): void
    {
        $status = (string) ($user->status ?? '');

        if ($status === UserStatusEnum::SUSPENDED->value) {
            throw OtpException::userBlocked();
        }

        if ($status !== '' && $status !== UserStatusEnum::ACTIVE->value) {
            throw OtpException::userInactive();
        }
    }

    protected function completeLogin(string $target, ?UserRoleEnum $userType): array
    {
        $user = $this->users->findByMobileOrEmail($target);

        // Eligibility re-asserted above, so a missing user here is a race we
        // surface as the same not-registered error.
        if (! $user) {
            throw OtpException::userNotRegistered();
        }

        return [
            'user' => new UserResource($user->loadProfileRelation()),
            'token' => $this->issueToken($user),
        ];
    }

    /**
     * Signup OTP verify either authenticates an existing user (e.g. they
     * abandoned a half-finished registration) OR confirms the target so the
     * client can move on to the /register endpoint.
     */
    protected function completeSignup(string $target): array
    {
        $user = $this->users->findByMobileOrEmail($target);

        if (! $user) {
            return ['target' => $target];
        }

        return [
            'user' => new UserResource($user->loadProfileRelation()),
            'token' => $this->issueToken($user),
        ];
    }

    protected function completePhoneUpdate(User $authUser, string $newMobile, ?string $countryCode = null): array
    {
        return DB::transaction(function () use ($authUser, $newMobile, $countryCode) {
            // Prefer the explicit country_code from the request — the caller
            // already validated it (^\+[0-9]{1,4}$) and it covers any prefix,
            // not just the handful baked into splitCanonicalMobile. Only fall
            // back to deriving the split when no hint was sent (e.g. legacy
            // payloads). Bug previously: a country like "+33" would split to
            // [null, "+33…"], wiping country_code and prefixing mobile.
            if ($countryCode !== null && $countryCode !== '' && str_starts_with($newMobile, $countryCode)) {
                $local = substr($newMobile, strlen($countryCode));
            } else {
                [$derivedCountry, $derivedLocal] = User::splitCanonicalMobile($newMobile);
                $countryCode = $derivedCountry;
                $local = $derivedLocal;
            }

            $authUser->update([
                'country_code' => $countryCode,
                'mobile' => $local,
            ]);
            $fresh = $authUser->fresh()->loadProfileRelation();

            return ['user' => new UserResource($fresh)];
        });
    }

    protected function completeEmailUpdate(User $authUser, string $newEmail): array
    {
        return DB::transaction(function () use ($authUser, $newEmail) {
            $authUser->update(['email' => $newEmail]);
            $fresh = $authUser->fresh()->loadProfileRelation();

            return ['user' => new UserResource($fresh)];
        });
    }

    protected function findUserByChannel(OtpChannelEnum $channel, string $target): ?User
    {
        return $channel === OtpChannelEnum::EMAIL
            ? $this->users->findByEmail($target)
            : $this->users->findByMobile($target);
    }

    /**
     * @return array{target: string, expires_in: int, test_code: ?string}
     */
    protected function envelope(string $target): array
    {
        return [
            'target' => $target,
            'expires_in' => (int) $this->config->get('services.otp.ttl_seconds', 300),
            // Populated in local/staging when OTP_TEST_CODE is set; null in production.
            'test_code' => $this->config->get('services.otp.test_code'),
        ];
    }
}
