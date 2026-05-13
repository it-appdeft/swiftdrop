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
            'target' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'regex:/^[0-9]{4,8}$/'],
        ];
    }

    public function canonicalTarget(): string
    {
        $target = (string) $this->input('target');

        return Str::contains($target, '@') ? Str::lower(trim($target)) : preg_replace('/\s+/', '', $target);
    }
}
