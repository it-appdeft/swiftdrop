<?php

namespace App\Contracts\Profile;

use App\Models\Document;
use App\Models\User;

interface DriverProfileServiceInterface
{
    public function updateProfile(User $user, array $data): User;

    /** Step 1 of 3 — Bank Details. */
    public function setupStepBank(User $user, array $data): User;

    /** Step 2 of 3 — Vehicle Details. */
    public function setupStepVehicle(User $user, array $data): User;

    /** Step 3 of 3 — Document Upload. Auto-submits for verification. */
    public function setupStepDocuments(User $user, array $documents): User;

    public function uploadDocument(User $user, string $type, $file, ?string $expiresAt = null): Document;

    public function updateNotificationSettings(User $user, array $data): User;

    public function initiatePhoneChange(User $user, string $newPhone, string $countryCode): void;

    public function initiateEmailChange(User $user, string $newEmail): void;

    public function completePhoneChange(User $user, string $newPhone, string $code): User;

    public function completeEmailChange(User $user, string $newEmail, string $code): User;

    public function deleteAccount(User $user): bool;
}
