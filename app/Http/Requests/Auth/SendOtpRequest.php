<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class SendOtpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'target' => ['required', 'string', 'max:255', function ($attribute, $value, $fail) {
                if (Str::contains($value, '@')) {
                    if (! filter_var($value, FILTER_VALIDATE_EMAIL)) {
                        $fail('Enter a valid email address.');
                    }

                    return;
                }

                if (! preg_match('/^\+?[0-9\s\-]{7,20}$/', $value)) {
                    $fail('Enter a valid mobile number.');
                }
            }],
            'channel' => ['nullable', 'in:sms,email'],
        ];
    }

    /**
     * Canonical target identifier — phone numbers stripped of whitespace, emails lower-cased.
     */
    public function canonicalTarget(): string
    {
        $target = (string) $this->input('target');

        return Str::contains($target, '@') ? Str::lower(trim($target)) : preg_replace('/\s+/', '', $target);
    }
}
