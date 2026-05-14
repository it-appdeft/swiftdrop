<?php

namespace App\Http\Requests\Customer\Profile;

use App\Http\Requests\Auth\Concerns\CanonicalizesTarget;
use Illuminate\Foundation\Http\FormRequest;

class InitiatePhoneChangeRequest extends FormRequest
{
    use CanonicalizesTarget;

    public function authorize(): bool
    {
        return auth('sanctum')->check();
    }

    public function rules(): array
    {
        return [
            'mobile' => [
                'required',
                'string',
                'regex:/^[0-9\s\-]{6,20}$/',
            ],
            'country_code' => ['required', 'string', 'regex:/^\+[0-9]{1,4}$/'],
        ];
    }
}
