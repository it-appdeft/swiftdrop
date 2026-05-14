<?php

namespace App\Http\Controllers\Api\Driver;

use App\Contracts\Profile\DriverProfileServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Driver\Profile\CompleteEmailChangeRequest;
use App\Http\Requests\Driver\Profile\CompletePhoneChangeRequest;
use App\Http\Requests\Driver\Profile\DeleteAccountRequest;
use App\Http\Requests\Driver\Profile\InitiateEmailChangeRequest;
use App\Http\Requests\Driver\Profile\InitiatePhoneChangeRequest;
use App\Http\Requests\Driver\Profile\UpdateBankDetailsRequest;
use App\Http\Requests\Driver\Profile\UpdateNotificationSettingsRequest;
use App\Http\Requests\Driver\Profile\UpdateProfileRequest;
use App\Http\Requests\Driver\Profile\UpdateVehicleDetailsRequest;
use App\Http\Requests\Driver\Profile\UploadDocumentsRequest;
use App\Http\Requests\Driver\Profile\UploadSingleDocumentRequest;
use App\Http\Resources\Driver\DriverDocumentResource;
use App\Http\Resources\Driver\DriverProfileResource;
use App\Models\DriverProfile;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class DriverProfileController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected DriverProfileServiceInterface $profile,
    ) {
    }

    public function show(): JsonResponse
    {
        $user = auth('sanctum')->user();
        $profile = $user->driverProfile;
        $profile?->load('documents');

        return $this->success(
            data: new DriverProfileResource($profile),
            message: 'Driver profile retrieved.',
        );
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = auth('sanctum')->user();
        $updatedUser = $this->profile->updateProfile($user, $request->validated());

        return $this->success(
            data: new DriverProfileResource($updatedUser->driverProfile->load('documents')),
            message: 'Profile updated.',
        );
    }

    /**
     * Step 1 of 3 — Bank Details. Resubmission overwrites; setup_step never
     * regresses.
     */
    public function setupStepBank(UpdateBankDetailsRequest $request): JsonResponse
    {
        $user = auth('sanctum')->user();
        $updatedUser = $this->profile->setupStepBank($user, $request->validated());

        return $this->stepResponse(
            $updatedUser->driverProfile->load('documents'),
            DriverProfile::SETUP_STEP_BANK,
            'Bank Details',
        );
    }

    /**
     * Step 2 of 3 — Vehicle Details.
     */
    public function setupStepVehicle(UpdateVehicleDetailsRequest $request): JsonResponse
    {
        $user = auth('sanctum')->user();
        $updatedUser = $this->profile->setupStepVehicle($user, $request->validated());

        return $this->stepResponse(
            $updatedUser->driverProfile->load('documents'),
            DriverProfile::SETUP_STEP_VEHICLE,
            'Vehicle Details',
        );
    }

    /**
     * Step 3 of 3 — Document Upload. Auto-marks the driver as
     * pending-approval on first completion.
     */
    public function setupStepDocuments(UploadDocumentsRequest $request): JsonResponse
    {
        $user = auth('sanctum')->user();
        $updatedUser = $this->profile->setupStepDocuments($user, $request->validatedDocuments());

        return $this->stepResponse(
            $updatedUser->driverProfile->load('documents'),
            DriverProfile::SETUP_STEP_DOCUMENTS,
            'Document Upload',
            status: 201,
        );
    }

    public function uploadDocument(UploadSingleDocumentRequest $request): JsonResponse
    {
        $user = auth('sanctum')->user();
        $document = $this->profile->uploadDocument(
            $user,
            (string) $request->input('type'),
            $request->file('file'),
            $request->input('expires_at'),
        );

        return $this->success(
            data: new DriverDocumentResource($document),
            message: 'Document uploaded.',
            status: 201,
        );
    }

    public function updateNotificationSettings(UpdateNotificationSettingsRequest $request): JsonResponse
    {
        $user = auth('sanctum')->user();
        $updatedUser = $this->profile->updateNotificationSettings($user, $request->validated());

        return $this->success(
            data: new DriverProfileResource($updatedUser->driverProfile->load('documents')),
            message: 'Notification settings updated.',
        );
    }

    public function initiatePhoneChange(InitiatePhoneChangeRequest $request): JsonResponse
    {
        $user = auth('sanctum')->user();
        $mobile = $request->canonicalMobile();

        $this->profile->initiatePhoneChange($user, $request->input('mobile'), $request->input('country_code'));

        return $this->success(
            data: [
                'target' => $mobile,
                'expires_in' => (int) config('services.otp.ttl_seconds', 300),
                'test_code' => config('services.otp.test_code'),
            ],
            message: 'OTP sent to new phone number.',
        );
    }

    public function initiateEmailChange(InitiateEmailChangeRequest $request): JsonResponse
    {
        $user = auth('sanctum')->user();
        $email = $request->canonicalEmail();

        $this->profile->initiateEmailChange($user, $request->input('email'));

        return $this->success(
            data: [
                'target' => $email,
                'expires_in' => (int) config('services.otp.ttl_seconds', 300),
                'test_code' => config('services.otp.test_code'),
            ],
            message: 'OTP sent to new email address.',
        );
    }

    public function completePhoneChange(CompletePhoneChangeRequest $request): JsonResponse
    {
        $user = auth('sanctum')->user();
        $updatedUser = $this->profile->completePhoneChange(
            $user,
            $request->canonicalMobile(),
            $request->input('code'),
        );

        return $this->success(
            data: new DriverProfileResource($updatedUser->driverProfile->load('documents')),
            message: 'Phone number updated successfully.',
        );
    }

    public function completeEmailChange(CompleteEmailChangeRequest $request): JsonResponse
    {
        $user = auth('sanctum')->user();
        $updatedUser = $this->profile->completeEmailChange(
            $user,
            $request->canonicalEmail(),
            $request->input('code'),
        );

        return $this->success(
            data: new DriverProfileResource($updatedUser->driverProfile->load('documents')),
            message: 'Email address updated successfully.',
        );
    }

    public function deleteAccount(DeleteAccountRequest $request): JsonResponse
    {
        $user = auth('sanctum')->user();
        $this->profile->deleteAccount($user);

        return $this->success(
            message: 'Account deleted successfully.',
        );
    }

    /**
     * Build the per-step success response — confirms which step just
     * completed and tells the client which step to render next.
     */
    protected function stepResponse(
        DriverProfile $profile,
        int $stepCompleted,
        string $stepLabel,
        int $status = 200,
    ): JsonResponse {
        $isFinalStep = $stepCompleted >= DriverProfile::SETUP_STEP_DOCUMENTS;
        $message = $isFinalStep
            ? "Step {$stepCompleted} ({$stepLabel}) completed. Profile submitted for verification."
            : "Step {$stepCompleted} ({$stepLabel}) completed. Proceed to step ".($stepCompleted + 1).'.';

        return $this->success(
            data: [
                'profile' => new DriverProfileResource($profile),
                'step_completed' => $stepCompleted,
                'next_step' => $profile->nextSetupStep(),
                'is_setup_complete' => $profile->isSetupComplete(),
            ],
            message: $message,
            status: $status,
        );
    }
}
