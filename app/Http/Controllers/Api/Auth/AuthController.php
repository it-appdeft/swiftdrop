<?php

namespace App\Http\Controllers\Api\Auth;

use App\Contracts\Auth\OtpServiceInterface;
use App\Contracts\Auth\RegistrationServiceInterface;
use App\Enums\OtpChannelEnum;
use App\Exceptions\Auth\OtpException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\RegisterRestaurantRequest;
use App\Http\Requests\Auth\SendLoginOtpRequest;
use App\Http\Requests\Auth\SendOtpRequest;
use App\Http\Requests\Auth\VerifyLoginOtpRequest;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Http\Resources\UserResource;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Traits\ApiResponse;
use App\Traits\IssuesTokens;
use Illuminate\Http\JsonResponse;

class AuthController extends Controller
{
    use ApiResponse, IssuesTokens;

    public function __construct(
        protected OtpServiceInterface $otp,
        protected RegistrationServiceInterface $registration,
        protected UserRepositoryInterface $users,
    ) {
    }

    /**
     * Common mobile-only login: send OTP. Used by both customer and driver
     * apps. Mobile must already be registered — otherwise the client is
     * directed to the signup flow.
     */
    public function sendLoginOtp(SendLoginOtpRequest $request): JsonResponse
    {
        $mobile = $request->canonicalMobile();

        if (! $this->users->findByMobile($mobile)) {
            throw OtpException::mobileNotRegistered();
        }

        $this->otp->send($mobile, OtpChannelEnum::SMS);

        return $this->success(
            data: [
                'target' => $mobile,
                'expires_in' => (int) config('services.otp.ttl_seconds', 300),
                'test_code' => config('services.otp.test_code'),
            ],
            message: 'OTP sent.',
        );
    }

    /**
     * Common mobile-only login: verify OTP and return token + user. The
     * user is resolved from the canonical mobile, so customer and driver
     * both flow through here — the role on the user record tells the
     * client which app surface to load.
     */
    public function verifyLoginOtp(VerifyLoginOtpRequest $request): JsonResponse
    {
        $mobile = $request->canonicalMobile();

        $user = $this->users->findByMobile($mobile);
        if (! $user) {
            throw OtpException::mobileNotRegistered();
        }

        $this->otp->verifyOrFail($mobile, (string) $request->input('code'));

        return $this->success(
            data: [
                'user' => new UserResource($user->loadProfileRelation()),
                'token' => $this->issueToken($user),
            ],
            message: 'Authenticated.',
        );
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

    public function register(RegisterRequest $request, string $type): JsonResponse
    {
        $allowedTypes = ['customer', 'driver'];

        if (! in_array($type, $allowedTypes)) {
            abort(404, 'Invalid registration type');
        }
        
        $user = $this->registration->register($request->validated(), $type);

        return $this->success(
            data: [
                'user' => new UserResource($user),
                'token' => $this->issueToken($user),
            ],
            message: ucfirst($type) . ' registered.',
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

}
