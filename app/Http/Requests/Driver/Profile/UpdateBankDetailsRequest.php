<?php

namespace App\Http\Requests\Driver\Profile;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBankDetailsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('sanctum')->check();
    }

    public function rules(): array
    {
        return [
            'account_holder_name' => ['required', 'string', 'min:2', 'max:100'],
            'account_number' => ['required', 'string', 'regex:/^[0-9]{6,12}$/'],
            'sort_code' => ['required', 'string', 'regex:/^[0-9]{2}-?[0-9]{2}-?[0-9]{2}$/'],
            'bank_name' => ['required', 'string', 'min:2', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'account_number.regex' => 'Account number must be 6-12 digits.',
            'sort_code.regex' => 'Sort code must be in format XX-XX-XX or XXXXXX.',
        ];
    }
}
