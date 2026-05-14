<?php

namespace App\Contracts\Profile;

use App\Models\User;
use App\Models\CustomerAddress;

interface CustomerProfileServiceInterface
{
    public function updateProfile(User $user, array $data): User;

    public function initiatePhoneChange(User $user, string $newPhone, string $countryCode): void;

    public function initiateEmailChange(User $user, string $newEmail): void;

    public function completePhoneChange(User $user, string $newPhone, string $code): User;

    public function completeEmailChange(User $user, string $newEmail, string $code): User;

    public function addAddress(User $user, array $data): CustomerAddress;

    public function updateAddress(User $user, int $addressId, array $data): CustomerAddress;

    public function deleteAddress(User $user, int $addressId): bool;

    public function setDefaultAddress(User $user, int $addressId): CustomerAddress;

    public function deleteAccount(User $user): bool;
}
