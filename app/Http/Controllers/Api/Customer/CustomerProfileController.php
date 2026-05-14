<?php

namespace App\Http\Controllers\Api\Customer;

use App\Contracts\Profile\CustomerProfileServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\Profile\AddAddressRequest;
use App\Http\Requests\Customer\Profile\CompleteEmailChangeRequest;
use App\Http\Requests\Customer\Profile\CompletePhoneChangeRequest;
use App\Http\Requests\Customer\Profile\DeleteAccountRequest;
use App\Http\Requests\Customer\Profile\InitiateEmailChangeRequest;
use App\Http\Requests\Customer\Profile\InitiatePhoneChangeRequest;
use App\Http\Requests\Customer\Profile\UpdateAddressRequest;
use App\Http\Requests\Customer\Profile\UpdateProfileRequest;
use App\Http\Resources\Customer\AddressResource;
use App\Http\Resources\Customer\CustomerProfileResource;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class CustomerProfileController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected CustomerProfileServiceInterface $profile,
    ) {
    }

    public function show(): JsonResponse
    {
        $user = auth('sanctum')->user();

        return $this->success(
            data: new CustomerProfileResource($user->customerProfile),
            message: 'Profile retrieved.',
        );
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    { 
        $user = auth('sanctum')->user();
        $updatedUser = $this->profile->updateProfile($user, $request->validated());

        return $this->success(
            data: new CustomerProfileResource($updatedUser->customerProfile),
            message: 'Profile updated.',
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
            data: new CustomerProfileResource($updatedUser->customerProfile),
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
            data: new CustomerProfileResource($updatedUser->customerProfile),
            message: 'Email address updated successfully.',
        );
    }

    public function addAddress(AddAddressRequest $request): JsonResponse
    {
        $user = auth('sanctum')->user();
        $address = $this->profile->addAddress($user, $request->validated());

        return $this->success(
            data: new AddressResource($address),
            message: 'Address added successfully.',
            status: 201,
        );
    }

    public function updateAddress(int $addressId, UpdateAddressRequest $request): JsonResponse
    {
        $user = auth('sanctum')->user();
        $address = $this->profile->updateAddress($user, $addressId, $request->validated());

        return $this->success(
            data: new AddressResource($address),
            message: 'Address updated successfully.',
        );
    }

    public function deleteAddress(int $addressId): JsonResponse
    {
        $user = auth('sanctum')->user();
        $this->profile->deleteAddress($user, $addressId);

        return $this->success(
            message: 'Address deleted successfully.',
        );
    }

    public function setDefaultAddress(int $addressId): JsonResponse
    {
        $user = auth('sanctum')->user();
        $address = $this->profile->setDefaultAddress($user, $addressId);

        return $this->success(
            data: new AddressResource($address),
            message: 'Default address updated.',
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
