<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class VerifyOtpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required_without:mobile', 'nullable', 'email', 'max:255'],
            'country_code' => ['required_with:mobile', 'nullable', 'string', 'regex:/^\+[0-9]{1,4}$/'],
            'mobile' => ['required_without:email', 'nullable', 'string', 'regex:/^[0-9\s\-]{6,20}$/'],
            'code' => ['required', 'string', 'regex:/^[0-9]{4,8}$/'],
        ];
    }

    /**
     * Canonical target — emails lower-cased, mobile numbers joined to E.164.
     * Mirrors {@see SendOtpRequest::canonicalTarget()} so the same payload works for both endpoints.
     */
    public function canonicalTarget(): string
    {
        if ($this->filled('email')) {
            return Str::lower(trim((string) $this->input('email')));
        }

        $code = (string) $this->input('country_code', '');
        $mobile = preg_replace('/\s+/', '', (string) $this->input('mobile'));

        return Str::startsWith($mobile, '+') ? $mobile : ($code.$mobile);
    }
}
