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
    // Step 1 of the change-phone / change-email flow — confirms ownership
    // of the *current* identifier before the user is allowed to nominate
    // a new one. No mutation happens on verify; the client just unlocks
    // the next screen.
    case VERIFY_CURRENT_PHONE = 'verify_current_phone';
    case VERIFY_CURRENT_EMAIL = 'verify_current_email';

    /** Auth flows that mutate or read the currently-signed-in user. */
    public function requiresAuth(): bool
    {
        return $this === self::UPDATE_EMAIL
            || $this === self::UPDATE_PHONE
            || $this === self::VERIFY_CURRENT_PHONE
            || $this === self::VERIFY_CURRENT_EMAIL;
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

    /**
     * The target identifier MUST already belong to the authenticated user
     * — used by the "verify current" step so a logged-in attacker can't
     * use the endpoint to probe other people's identifiers.
     */
    public function expectsAuthUserTarget(): bool
    {
        return $this === self::VERIFY_CURRENT_PHONE
            || $this === self::VERIFY_CURRENT_EMAIL;
    }

    /** The channel implied by the type, when the type pins it. */
    public function implicitChannel(): ?OtpChannelEnum
    {
        return match ($this) {
            self::UPDATE_EMAIL, self::VERIFY_CURRENT_EMAIL => OtpChannelEnum::EMAIL,
            self::UPDATE_PHONE, self::VERIFY_CURRENT_PHONE => OtpChannelEnum::SMS,
            default => null,
        };
    }
}
