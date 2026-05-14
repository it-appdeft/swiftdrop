<?php

namespace App\Http\Controllers\Api\Driver;

use App\Contracts\Profile\DriverProfileServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Driver\Profile\CompleteEmailChangeRequest;
use App\Http\Requests\Driver\Profile\CompletePhoneChangeRequest;
use App\Http\Requests\Driver\Profile\CompleteSetupRequest;
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

    public function completeSetup(CompleteSetupRequest $request): JsonResponse
    {
        $user = auth('sanctum')->user();
        $updatedUser = $this->profile->completeSetup(
            $user,
            $request->bankDetails(),
            $request->vehicleDetails(),
            $request->documentFiles(),
        );

        return $this->success(
            data: new DriverProfileResource($updatedUser->driverProfile->load('documents')),
            message: 'Profile setup submitted for verification.',
            status: 201,
        );
    }

    public function updateBankDetails(UpdateBankDetailsRequest $request): JsonResponse
    {
        $user = auth('sanctum')->user();
        $updatedUser = $this->profile->updateBankDetails($user, $request->validated());

        return $this->success(
            data: new DriverProfileResource($updatedUser->driverProfile->load('documents')),
            message: 'Bank details updated.',
        );
    }

    public function updateVehicleDetails(UpdateVehicleDetailsRequest $request): JsonResponse
    {
        $user = auth('sanctum')->user();
        $updatedUser = $this->profile->updateVehicleDetails($user, $request->validated());

        return $this->success(
            data: new DriverProfileResource($updatedUser->driverProfile->load('documents')),
            message: 'Vehicle details updated.',
        );
    }

    public function uploadDocuments(UploadDocumentsRequest $request): JsonResponse
    {
        $user = auth('sanctum')->user();
        $documents = $request->validatedDocuments();
        $updatedUser = $this->profile->uploadDocuments($user, $documents);

        return $this->success(
            data: new DriverProfileResource($updatedUser->driverProfile->load('documents')),
            message: 'Documents uploaded.',
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

    public function submitForVerification(): JsonResponse
    {
        $user = auth('sanctum')->user();
        $updatedUser = $this->profile->submitForVerification($user);

        return $this->success(
            data: new DriverProfileResource($updatedUser->driverProfile->load('documents')),
            message: 'Submitted for verification.',
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
}
