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

    /**
     * Update any combination of bank, vehicle, and document fields in a
     * single request. Used after setup is complete to edit existing details.
     */
    public function updateAccountDetails(User $user, array $data, array $documents = []): User;

    public function uploadDocument(User $user, string $type, $file, ?string $expiresAt = null): Document;

    public function updateNotificationSettings(User $user, array $data): User;

    public function deleteAccount(User $user): bool;
}
