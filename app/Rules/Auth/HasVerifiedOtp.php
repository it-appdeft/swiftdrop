<?php

namespace App\Rules\Auth;

use App\Repositories\Contracts\OtpCodeRepositoryInterface;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validates that the given canonical target (email or E.164 mobile) has
 * successfully completed an OTP verification. Used by registration requests
 * to prevent submitting the form without first verifying email and mobile.
 */
class HasVerifiedOtp implements ValidationRule
{
    public function __construct(
        private readonly string $canonicalTarget,
        private readonly string $channelLabel = 'identifier',
    ) {
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (trim($this->canonicalTarget) === '') {
            // The base required/format rules will catch empty input; nothing to do here.
            return;
        }

        $repo = app(OtpCodeRepositoryInterface::class);

        if (! $repo->hasVerifiedFor($this->canonicalTarget)) {
            $fail("Please verify your {$this->channelLabel} via OTP before completing registration.");
        }
    }
}
