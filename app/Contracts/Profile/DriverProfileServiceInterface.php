<?php

namespace App\Contracts\Profile;

use App\Models\Document;
use App\Models\User;

interface DriverProfileServiceInterface
{
    public function updateProfile(User $user, array $data): User;

    public function completeSetup(User $user, array $bank, array $vehicle, array $documents): User;

    public function updateBankDetails(User $user, array $data): User;

    public function updateVehicleDetails(User $user, array $data): User;

    public function uploadDocument(User $user, string $type, $file, ?string $expiresAt = null): Document;

    public function uploadDocuments(User $user, array $documents): User;

    public function updateNotificationSettings(User $user, array $data): User;

    public function submitForVerification(User $user): User;

    public function initiatePhoneChange(User $user, string $newPhone, string $countryCode): void;

    public function initiateEmailChange(User $user, string $newEmail): void;

    public function completePhoneChange(User $user, string $newPhone, string $code): User;

    public function completeEmailChange(User $user, string $newEmail, string $code): User;

    public function deleteAccount(User $user): bool;
}
