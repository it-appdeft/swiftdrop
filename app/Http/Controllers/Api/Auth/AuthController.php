<?php

namespace App\Http\Controllers\Api\Auth;

use App\Contracts\Auth\OtpServiceInterface;
use App\Contracts\Auth\RegistrationServiceInterface;
use App\Enums\OtpChannelEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterCustomerRequest;
use App\Http\Requests\Auth\RegisterRestaurantRequest;
use App\Http\Requests\Auth\SendOtpRequest;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class AuthController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected OtpServiceInterface $otp,
        protected RegistrationServiceInterface $registration,
    ) {
    }

    public function sendOtp(SendOtpRequest $request): JsonResponse
    {
        $target = $request->canonicalTarget();
        $channel = OtpChannelEnum::tryFrom((string) $request->input('channel'));

        $this->otp->send($target, $channel);

        return $this->success(
            message: 'OTP sent.',
            data: [
                'expires_in' => (int) config('services.otp.ttl_seconds', 300),
                // Only populated in local/staging when OTP_TEST_CODE is set; null in production.
                'test_code' => config('services.otp.test_code'),
            ],
        );
    }

    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        $target = $request->canonicalTarget();
        $user = $this->otp->verifyAndFindUser($target, (string) $request->input('code'));

        if (! $user) {
            return $this->success(
                data: ['target' => $target],
                message: 'Verified — please complete registration.',
            );
        }

        return $this->success(
            data: [
                'user' => new UserResource($user),
                'token' => $this->issueToken($user),
            ],
            message: 'Authenticated.',
        );
    }

    public function registerCustomer(RegisterCustomerRequest $request): JsonResponse
    {
        $user = $this->registration->registerCustomer($request->validated());

        return $this->success(
            data: [
                'user' => new UserResource($user),
                'token' => $this->issueToken($user),
            ],
            message: 'Customer registered.',
            status: 201,
        );
    }

    public function registerRestaurant(RegisterRestaurantRequest $request): JsonResponse
    {
        $user = $this->registration->registerRestaurant($request->validated());

        return $this->success(
            data: [
                'user' => new UserResource($user),
                'token' => $this->issueToken($user),
            ],
            message: 'Restaurant registered.',
            status: 201,
        );
    }

    /**
     * Returns null until Laravel Sanctum is installed and the HasApiTokens trait is added to the User model.
     */
    protected function issueToken(User $user): ?string
    {
        if (! method_exists($user, 'createToken')) {
            return null;
        }

        return $user->createToken('mobile-app')->plainTextToken;
    }
}
