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
    ): array {
        $this->assertAuthContext($type, $authUser);
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
    ): array {
        $this->assertAuthContext($type, $authUser);

        // Re-run the send-time eligibility checks so a stale OTP can't be
        // used to e.g. log into a suspended account or claim an identifier
        // that has since been registered to someone else.
        $this->assertEligibleToSend($type, $channel, $target, $userType, $authUser);

        $this->otp->verifyOrFail($target, $code);

        return match ($type) {
            OtpTypeEnum::LOGIN => $this->completeLogin($target, $userType),
            OtpTypeEnum::SIGNUP => $this->completeSignup($target),
            OtpTypeEnum::UPDATE_PHONE => $this->completePhoneUpdate($authUser, $target),
            OtpTypeEnum::UPDATE_EMAIL => $this->completeEmailUpdate($authUser, $target),
        };
    }

    protected function assertAuthContext(OtpTypeEnum $type, ?User $authUser): void
    {
        if ($type->requiresAuth() && ! $authUser) {
            throw OtpException::authRequired();
        }
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
        };
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

    protected function completePhoneUpdate(User $authUser, string $newMobile): array
    {
        return DB::transaction(function () use ($authUser, $newMobile) {
            $authUser->update(['mobile' => $newMobile]);
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
