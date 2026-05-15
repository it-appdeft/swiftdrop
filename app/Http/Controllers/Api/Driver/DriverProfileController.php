<?php

namespace App\Http\Controllers\Api\Driver;

use App\Contracts\Profile\DriverProfileServiceInterface;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Requests\Driver\Profile\DeleteAccountRequest;
use App\Http\Requests\Driver\Profile\UpdateAccountDetailsRequest;
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

    public function setup(Request $request): JsonResponse
    {
        $step = (int) $request->input('step');
        $user = auth('sanctum')->user();

        return match ($step) {
            1 => $this->handleStepBank(app(UpdateBankDetailsRequest::class), $user),
            2 => $this->handleStepVehicle(app(UpdateVehicleDetailsRequest::class), $user),
            3 => $this->handleStepDocuments(app(UploadDocumentsRequest::class), $user),
            default => $this->error('Invalid step. Must be 1, 2, or 3.', 422),
        };
    }

    private function handleStepBank(UpdateBankDetailsRequest $request, $user): JsonResponse
    {
        $updatedUser = $this->profile->setupStepBank($user, $request->validated());

        return $this->stepResponse(
            $updatedUser->driverProfile->load('documents'),
            DriverProfile::SETUP_STEP_BANK,
            'Bank Details',
        );
    }

    private function handleStepVehicle(UpdateVehicleDetailsRequest $request, $user): JsonResponse
    {
        $updatedUser = $this->profile->setupStepVehicle($user, $request->validated());

        return $this->stepResponse(
            $updatedUser->driverProfile->load('documents'),
            DriverProfile::SETUP_STEP_VEHICLE,
            'Vehicle Details',
        );
    }

    private function handleStepDocuments(UploadDocumentsRequest $request, $user): JsonResponse
    {
        $updatedUser = $this->profile->setupStepDocuments($user, $request->validatedDocuments());

        return $this->stepResponse(
            $updatedUser->driverProfile->load('documents'),
            DriverProfile::SETUP_STEP_DOCUMENTS,
            'Document Upload',
            status: 201,
        );
    }    

    /**
     * Update bank, vehicle, and document details in one call (post-setup
     * edit screen). Any field omitted from the request is left as-is; only
     * the documents the driver re-uploads replace the previous files.
     */
    public function updateAccountDetails(UpdateAccountDetailsRequest $request): JsonResponse
    {
        $user = auth('sanctum')->user();
        $updatedUser = $this->profile->updateAccountDetails(
            $user,
            $request->validatedFields(),
            $request->validatedDocuments(),
        );

        return $this->success(
            data: new DriverProfileResource($updatedUser->driverProfile->load('documents')),
            message: 'Account details updated successfully.',
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
