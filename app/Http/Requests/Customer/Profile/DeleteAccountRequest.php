<?php

namespace App\Http\Requests\Customer\Profile;

use App\Enums\UserRoleEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DeleteAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check() || auth('sanctum')->check();
    }

    public function rules(): array
    {
        return [
            'reason_id' => [
                'required',
                'integer',
                Rule::exists('deletion_reasons', 'id')
                    ->where(fn ($q) => $q->where('role', UserRoleEnum::CUSTOMER->value)
                        ->where('is_active', true)
                        ->whereNull('deleted_at')),
            ],
            // Optional free-text. Doubles as feedback for the standard
            // reasons (screen 82) and as the manual description when the
            // user picks "Other" — optional in both cases.
            'description' => ['nullable', 'string', 'max:1000'],
            'code' => ['required', 'string', 'regex:/^\d{4,8}$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'reason_id.exists' => 'Please choose a valid deletion reason.',
            'code.regex' => 'The verification code must be 4 to 8 digits.',
        ];
    }
}
