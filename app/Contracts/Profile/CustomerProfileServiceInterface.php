<?php

namespace App\Contracts\Profile;

use App\Models\CustomerAddress;
use App\Models\User;

interface CustomerProfileServiceInterface
{
    public function updateProfile(User $user, array $data): User;

    public function addAddress(User $user, array $data): CustomerAddress;

    public function updateAddress(User $user, int $addressId, array $data): CustomerAddress;

    public function deleteAddress(User $user, int $addressId): bool;

    public function setDefaultAddress(User $user, int $addressId): CustomerAddress;

    public function setSelectedAddress(User $user, int $addressId): CustomerAddress;

    public function initiateDeletion(User $user): string;

    public function deleteAccount(User $user, array $data): bool;
}
