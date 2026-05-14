<?php

namespace App\Http\Requests\Auth;

use App\Http\Requests\Auth\Concerns\CanonicalizesTarget;
use App\Rules\Auth\HasVerifiedOtp;
use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    use CanonicalizesTarget;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:100'],
            'email' => [
                'required',
                'email',
                'max:255',
                'unique:users,email',
                new HasVerifiedOtp($this->canonicalEmail(), 'email'),
            ],
            'country_code' => ['required', 'string', 'regex:/^\+[0-9]{1,4}$/'],
            'mobile' => [
                'required',
                'string',
                'regex:/^[0-9\s\-]{6,20}$/',
                new HasVerifiedOtp($this->canonicalMobile(), 'mobile number'),
            ],
        ];
    }
}
