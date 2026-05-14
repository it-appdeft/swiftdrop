<?php

namespace App\Services\Profile;

use App\Contracts\Profile\DriverProfileServiceInterface;
use App\Enums\ApprovalStatusEnum;
use App\Models\Document;
use App\Models\DriverProfile;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class DriverProfileService extends BaseProfileService implements DriverProfileServiceInterface
{
    /**
     * Document types accepted during driver onboarding.
     * Keep keys stable — clients reference them in upload payloads.
     */
    public const DOCUMENT_TYPES = [
        'driving_licence_front',
        'driving_licence_back',
        'id_proof',
        'insurance_certificate',
        'vehicle_registration_certificate',
    ];

    public function updateProfile(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data) {
            $profile = $this->profileOrFail($user);

            $updateData = [];

            if (isset($data['name'])) {
                $updateData['first_name'] = $this->firstName($data['name']);
                $updateData['last_name'] = $this->lastName($data['name']);
            }

            if (array_key_exists('date_of_birth', $data)) {
                $updateData['date_of_birth'] = $data['date_of_birth'];
            }

            if (isset($data['profile_photo'])) {
                $updateData['profile_photo'] = $this->imageUpload->update(
                    $data['profile_photo'],
                    'driver/profile',
                    $profile->profile_photo,
                );
            }

            if (! empty($updateData)) {
                $profile->update($updateData);
            }

            return $user->fresh()->loadProfileRelation();
        });
    }

    /**
     * Step 1 — Bank Details. Re-submission overwrites; setup_step only ever
     * advances forward (never regresses if the driver is already past step 1).
     */
    public function setupStepBank(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data) {
            $profile = $this->profileOrFail($user);

            $profile->update([
                'account_holder_name' => $data['account_holder_name'],
                'account_number' => $data['account_number'],
                'sort_code' => $data['sort_code'],
                'bank_name' => $data['bank_name'],
            ]);

            $this->advanceSetupStep($profile, DriverProfile::SETUP_STEP_BANK);

            return $user->fresh()->loadProfileRelation();
        });
    }

    /**
     * Step 2 — Vehicle Details. Requires Step 1 to have been completed at
     * least once.
     */
    public function setupStepVehicle(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data) {
            $profile = $this->profileOrFail($user);

            if ($profile->setup_step < DriverProfile::SETUP_STEP_BANK) {
                throw ValidationException::withMessages([
                    'setup_step' => ['Complete Step 1 (Bank Details) before submitting vehicle details.'],
                ]);
            }

            $profile->update([
                'vehicle_type' => $data['vehicle_type'],
                'vehicle_registration' => $data['vehicle_registration'],
                'vehicle_make' => $data['vehicle_make'] ?? $profile->vehicle_make,
                'vehicle_model' => $data['vehicle_model'] ?? $profile->vehicle_model,
                'vehicle_color' => $data['vehicle_color'] ?? $profile->vehicle_color,
                'year_of_manufacture' => $data['year_of_manufacture'] ?? $profile->year_of_manufacture,
                'insurance_type' => $data['insurance_type'] ?? $profile->insurance_type,
                'insurance_expiry_date' => $data['insurance_expiry_date'] ?? $profile->insurance_expiry_date,
                'mot_expiry_date' => $data['mot_expiry_date'] ?? $profile->mot_expiry_date,
            ]);

            $this->advanceSetupStep($profile, DriverProfile::SETUP_STEP_VEHICLE);

            return $user->fresh()->loadProfileRelation();
        });
    }

    /**
     * Step 3 — Document upload. Replaces any existing files for the same
     * type. Marks the driver as submitted-for-verification on first
     * completion.
     */
    public function setupStepDocuments(User $user, array $documents): User
    {
        return DB::transaction(function () use ($user, $documents) {
            $profile = $this->profileOrFail($user);

            if ($profile->setup_step < DriverProfile::SETUP_STEP_VEHICLE) {
                throw ValidationException::withMessages([
                    'setup_step' => ['Complete Step 2 (Vehicle Details) before uploading documents.'],
                ]);
            }

            foreach ($documents as $type => $file) {
                if ($file === null) {
                    continue;
                }
                $this->uploadDocument($user, $type, $file);
            }

            $this->advanceSetupStep($profile, DriverProfile::SETUP_STEP_DOCUMENTS);
            $profile->update(['approval_status' => ApprovalStatusEnum::PENDING->value]);

            return $user->fresh()->loadProfileRelation();
        });
    }

    public function uploadDocument(User $user, string $type, $file, ?string $expiresAt = null): Document
    {
        return DB::transaction(function () use ($user, $type, $file, $expiresAt) {
            $profile = $this->profileOrFail($user);

            if (! in_array($type, self::DOCUMENT_TYPES, true)) {
                throw new \InvalidArgumentException("Invalid document type: {$type}");
            }

            $existing = $profile->documents()->where('type', $type)->first();

            if ($existing) {
                $this->deleteDocumentFile($existing->file_path);
                $existing->delete();
            }

            /** @var UploadedFile $file */
            $path = $file->store("driver/documents/{$user->id}", 'public');
            $url = Storage::disk('public')->url($path);

            return $profile->documents()->create([
                'type' => $type,
                'file_path' => $url,
                'original_filename' => $file->getClientOriginalName(),
                'expires_at' => $expiresAt,
                'verification_status' => ApprovalStatusEnum::PENDING->value,
            ]);
        });
    }

    public function updateNotificationSettings(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data) {
            $profile = $this->profileOrFail($user);

            $update = [];
            if (array_key_exists('notify_delivery_updates', $data)) {
                $update['notify_delivery_updates'] = (bool) $data['notify_delivery_updates'];
            }
            if (array_key_exists('notify_general', $data)) {
                $update['notify_general'] = (bool) $data['notify_general'];
            }

            if (! empty($update)) {
                $profile->update($update);
            }

            return $user->fresh()->loadProfileRelation();
        });
    }

    public function deleteAccount(User $user): bool
    {
        return DB::transaction(function () use ($user) {
            $profile = $user->driverProfile;

            if ($profile) {
                foreach ($profile->documents as $doc) {
                    $this->deleteDocumentFile($doc->file_path);
                }
                $profile->documents()->delete();
                $profile->delete();
            }

            return $user->delete();
        });
    }

    protected function profileOrFail(User $user): DriverProfile
    {
        $profile = $user->driverProfile;

        if (! $profile) {
            throw new \InvalidArgumentException('Driver profile not found.');
        }

        return $profile;
    }

    /**
     * Setup step is monotonic: re-submitting an earlier step (e.g. driver
     * went back to edit bank details) does NOT pull progress backwards.
     */
    protected function advanceSetupStep(DriverProfile $profile, int $step): void
    {
        if ($profile->setup_step < $step) {
            $profile->update(['setup_step' => $step]);
        }
    }

    protected function deleteDocumentFile(?string $url): void
    {
        if (! $url) {
            return;
        }

        $this->imageUpload->deleteByUrl($url);
    }
}
