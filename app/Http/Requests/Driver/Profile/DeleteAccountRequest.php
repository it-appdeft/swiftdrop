<?php

namespace App\Http\Requests\Driver\Profile;

use Illuminate\Foundation\Http\FormRequest;

class DeleteAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('sanctum')->check();
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'regex:/^\d{4,8}$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'code.regex' => 'The verification code must be 4 to 8 digits.',
        ];
    }
}
