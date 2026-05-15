<?php

namespace App\Enums;

/**
 * Why an OTP is being sent / verified. Drives the validation, side-effects
 * and response shape of the unified /auth/send-otp and /auth/verify-otp
 * endpoints.
 */
enum OtpTypeEnum: string
{
    case LOGIN = 'login';
    case SIGNUP = 'signup';
    case UPDATE_EMAIL = 'update_email';
    case UPDATE_PHONE = 'update_phone';

    /** Auth flows that mutate the currently-signed-in user. */
    public function requiresAuth(): bool
    {
        return $this === self::UPDATE_EMAIL || $this === self::UPDATE_PHONE;
    }

    /** The user record must already exist for this flow to make sense. */
    public function expectsExistingUser(): bool
    {
        return $this === self::LOGIN;
    }

    /** The target identifier must NOT already be taken by another user. */
    public function expectsAvailableTarget(): bool
    {
        return $this === self::SIGNUP
            || $this === self::UPDATE_EMAIL
            || $this === self::UPDATE_PHONE;
    }

    /** The channel implied by the type, when the type pins it. */
    public function implicitChannel(): ?OtpChannelEnum
    {
        return match ($this) {
            self::UPDATE_EMAIL => OtpChannelEnum::EMAIL,
            self::UPDATE_PHONE => OtpChannelEnum::SMS,
            default => null,
        };
    }
}
