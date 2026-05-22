<?php

namespace App\Rules\Auth;

use App\Support\Countries;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validates that the submitted value is a known ISO 3166-1 alpha-2 country
 * code ("GB", "IN"). Paired with the dialling prefix so a shared prefix
 * (+44 → GB/JE/GG/IM, +1 → US/CA) still resolves to one exact country/flag.
 * Case-insensitive — requests upper-case the value in prepareForValidation().
 */
class ValidCountryIso implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || ! Countries::isValidIso($value)) {
            $fail('The selected country is invalid.');
        }
    }
}
