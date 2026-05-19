<?php

namespace App\Http\Controllers\Api\Auth;

use App\Contracts\Auth\OtpFlowServiceInterface;
use App\Contracts\Auth\RegistrationServiceInterface;
use App\Exceptions\InvalidInputException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\RegisterRestaurantRequest;
use App\Http\Requests\Auth\SendOtpRequest;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Http\Resources\UserResource;
use App\Traits\ApiResponse;
use App\Traits\IssuesTokens;
use Illuminate\Http\JsonResponse;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    use ApiResponse, IssuesTokens;

    public function __construct(
        protected OtpFlowServiceInterface $otpFlow,
        protected RegistrationServiceInterface $registration,
    ) {
    }

    /**
     * Unified OTP send endpoint. The (type, user_type, channel) tuple drives
     * eligibility checks and side-effects — see {@see OtpFlowServiceInterface}.
     */
    public function sendOtp(SendOtpRequest $request): JsonResponse
    {
        $data = $this->otpFlow->send(
            type: $request->otpType(),
            channel: $request->channel(),
            target: $request->target(),
            userType: $request->userRole(),
            authUser: auth('sanctum')->user(),
            countryCode: $request->countryCode(),
        );

        return $this->success(data: $data, message: 'OTP sent.');
    }

    /**
     * Unified OTP verify endpoint. Returns a token for login/signup or the
     * updated user for update_phone/update_email.
     */
    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        $data = $this->otpFlow->verify(
            type: $request->otpType(),
            channel: $request->channel(),
            target: $request->target(),
            code: $request->code(),
            userType: $request->userRole(),
            authUser: auth('sanctum')->user(),
            countryCode: $request->countryCode(),
        );

        return $this->success(data: $data, message: 'OTP verified.');
    }

    public function register(RegisterRequest $request, string $type): JsonResponse
    {
        $allowedTypes = ['customer', 'driver'];

        if (! in_array($type, $allowedTypes, true)) {
            throw InvalidInputException::make('Invalid registration type.', 'type');
        }

        $user = $this->registration->register($request->validated(), $type);

        return $this->success(
            data: [
                'user' => new UserResource($user),
                'token' => $this->issueToken($user),
            ],
            message: ucfirst($type).' registered.',
            status: 201,
        );
    }

    /**
     * Revoke the sanctum token used on this request — works for customer,
     * driver, restaurant and admin since they all authenticate the same
     * way. Pass `all=true` in the body to revoke every token for the user
     * (logs them out on every device).
     */
    public function logout(): JsonResponse
    {
        $user = auth('sanctum')->user();
        $logoutAll = (bool) request()->boolean('all');

        if ($logoutAll) {
            $user->tokens()->delete();
        } else {
            $current = $user->currentAccessToken();

            // currentAccessToken() can be a TransientToken (session-auth)
            // or null in edge cases — guard before calling delete().
            if ($current instanceof PersonalAccessToken) {
                $current->delete();
            }
        }

        return $this->success(
            message: $logoutAll ? 'Logged out on all devices.' : 'Logged out.',
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
