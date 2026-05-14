<?php

namespace App\Services\Profile;

use App\Contracts\Profile\CustomerProfileServiceInterface;
use App\Models\CustomerAddress;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CustomerProfileService extends BaseProfileService implements CustomerProfileServiceInterface
{
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
                throw new \InvalidArgumentException('Customer profile not found.');
            }

            $isDefault = $data['is_default'] ?? (! $profile->addresses()->exists());

            if ($isDefault) {
                $profile->addresses()->update(['is_default' => false]);
            }

            return $profile->addresses()->create(array_merge($data, [
                'is_default' => $isDefault,
            ]));
        });
    }

    public function updateAddress(User $user, int $addressId, array $data): CustomerAddress
    {
        return DB::transaction(function () use ($user, $addressId, $data) {
            $profile = $user->customerProfile;
            $address = $profile->addresses()->find($addressId);

            if (! $address) {
                throw new \InvalidArgumentException('Address not found.');
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
                throw new \InvalidArgumentException('Address not found.');
            }

            if ($address->is_default) {
                $nextAddress = $profile->addresses()
                    ->where('id', '!=', $addressId)
                    ->first();

                if ($nextAddress) {
                    $nextAddress->update(['is_default' => true]);
                }
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
                throw new \InvalidArgumentException('Address not found.');
            }

            $profile->addresses()->update(['is_default' => false]);
            $address->update(['is_default' => true]);

            return $address->fresh();
        });
    }

    public function deleteAccount(User $user): bool
    {
        return DB::transaction(function () use ($user) {
            $profile = $user->customerProfile;

            if ($profile) {
                $profile->addresses()->delete();
                $profile->delete();
            }

            return $user->delete();
        });
    }
}
