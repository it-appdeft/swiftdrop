<?php

namespace App\Services\Profile;

use App\Contracts\Auth\OtpServiceInterface;
use App\Contracts\Profile\CustomerProfileServiceInterface;
use App\Enums\OtpChannelEnum;
use App\Enums\UserRoleEnum;
use App\Exceptions\ApiException;
use App\Exceptions\ResourceNotFoundException;
use App\Models\CustomerAccountDeletionLog;
use App\Models\CustomerAddress;
use App\Models\DeletionReason;
use App\Models\User;
use App\Services\Files\ImageUploadService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class CustomerProfileService extends BaseProfileService implements CustomerProfileServiceInterface
{
    public function __construct(
        ImageUploadService $imageUpload,
        protected OtpServiceInterface $otp,
    ) {
        parent::__construct($imageUpload);
    }

    public function updateProfile(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data) {
            $profile = $user->customerProfile;

            if ($profile) {
                $updateData = [
                    'first_name' => $this->firstName($data['name']),
                    'last_name' => $this->lastName($data['name']),
                    'date_of_birth' => $data['date_of_birth'] ?? $profile->date_of_birth,
                ];

                if (isset($data['profile_photo'])) {
                    $updateData['profile_photo'] = $this->imageUpload->update(
                        $data['profile_photo'],
                        'profile',
                        $profile->profile_photo,
                    );
                }

                $profile->update($updateData);
            }

            return $user->fresh()->loadProfileRelation();
        });
    }

    public function addAddress(User $user, array $data): CustomerAddress
    {
        return DB::transaction(function () use ($user, $data) {
            $profile = $user->customerProfile;

            if (! $profile) {
                throw ResourceNotFoundException::for('Customer profile');
            }

            $hasAny = $profile->addresses()->exists();
            $isDefault = $data['is_default'] ?? (! $hasAny);

            if ($isDefault) {
                $profile->addresses()->update(['is_default' => false]);
            }

            // First-ever address is auto-selected so radius-based search works
            // without the customer having to pick one. Subsequent additions
            // keep whatever selection is already in place.
            $isSelected = ! $hasAny;

            return $profile->addresses()->create(array_merge($data, [
                'is_default' => $isDefault,
                'is_selected' => $isSelected,
            ]));
        });
    }

    public function setSelectedAddress(User $user, int $addressId): CustomerAddress
    {
        return DB::transaction(function () use ($user, $addressId) {
            $profile = $user->customerProfile;
            $address = $profile->addresses()->find($addressId);

            if (! $address) {
                throw ResourceNotFoundException::for('Address');
            }

            $profile->addresses()->update(['is_selected' => false]);
            $address->update(['is_selected' => true]);

            return $address->fresh();
        });
    }

    public function updateAddress(User $user, int $addressId, array $data): CustomerAddress
    {
        return DB::transaction(function () use ($user, $addressId, $data) {
            $profile = $user->customerProfile;
            $address = $profile->addresses()->find($addressId);

            if (! $address) {
                throw ResourceNotFoundException::for('Address');
            }

            if (($data['is_default'] ?? false) && ! $address->is_default) {
                $profile->addresses()->update(['is_default' => false]);
            }

            $address->update($data);

            return $address->fresh();
        });
    }

    public function deleteAddress(User $user, int $addressId): bool
    {
        return DB::transaction(function () use ($user, $addressId) {
            $profile = $user->customerProfile;
            $address = $profile->addresses()->find($addressId);

            if (! $address) {
                throw ResourceNotFoundException::for('Address');
            }

            // Move the default + selected flags onto a sibling when removing
            // the active address — otherwise the customer ends up with no
            // address driving the dashboard radius.
            $nextAddress = $address->is_default || $address->is_selected
                ? $profile->addresses()->where('id', '!=', $addressId)->first()
                : null;

            if ($nextAddress) {
                $nextAddress->update([
                    'is_default' => $nextAddress->is_default || $address->is_default,
                    'is_selected' => $nextAddress->is_selected || $address->is_selected,
                ]);
            }

            return $address->delete();
        });
    }

    public function setDefaultAddress(User $user, int $addressId): CustomerAddress
    {
        return DB::transaction(function () use ($user, $addressId) {
            $profile = $user->customerProfile;
            $address = $profile->addresses()->find($addressId);

            if (! $address) {
                throw ResourceNotFoundException::for('Address');
            }

            $profile->addresses()->update(['is_default' => false]);
            $address->update(['is_default' => true]);

            return $address->fresh();
        });
    }

    /**
     * Send a delete-account OTP to the user's mobile (or email if mobile is
     * unavailable). The OTP must be replayed back on the DELETE call.
     */
    public function initiateDeletion(User $user): string
    {
        [$target, $channel] = $this->deletionOtpTarget($user);

        $this->otp->send($target, $channel);

        return $target;
    }

    public function deleteAccount(User $user, array $data): bool
    {
        [$target] = $this->deletionOtpTarget($user);

        // Look up the chosen reason up front so a stale id or a reason that
        // was deactivated between picker-load and submit fails loudly before
        // we burn the OTP.
        $reason = DeletionReason::query()
            ->active()
            ->forRole(UserRoleEnum::CUSTOMER->value)
            ->find($data['reason_id']);

        if (! $reason) {
            throw ResourceNotFoundException::for('Deletion reason');
        }

        // Verify before the transaction so a bad code doesn't roll back work
        // we haven't started yet — and so the OtpException surfaces cleanly.
        $this->otp->verifyOrFail($target, $data['code']);

        return DB::transaction(function () use ($user, $data, $reason) {
            $profile = $user->customerProfile;

            CustomerAccountDeletionLog::create([
                'user_id' => $user->id,
                'mobile' => $user->canonical_mobile,
                'email' => $user->email,
                'first_name' => $profile?->first_name,
                'last_name' => $profile?->last_name,
                'deletion_reason_id' => $reason->id,
                'reason_label' => $reason->label,
                'reason_slug' => $reason->slug,
                'description' => $data['description'] ?? null,
                'deleted_at' => Carbon::now(),
            ]);

            if ($profile) {
                $profile->addresses()->delete();
                $profile->delete();
            }

            $user->tokens()->delete();

            return $user->delete();
        });
    }

    /**
     * @return array{0: string, 1: OtpChannelEnum}
     */
    protected function deletionOtpTarget(User $user): array
    {
        // canonical_mobile rebuilds the full E.164 from the split storage.
        if ($user->canonical_mobile) {
            return [$user->canonical_mobile, OtpChannelEnum::SMS];
        }

        if ($user->email) {
            return [$user->email, OtpChannelEnum::EMAIL];
        }

        throw new ApiException(
            message: 'No mobile or email on file to send a verification code.',
            status: 422,
        );
    }
}
