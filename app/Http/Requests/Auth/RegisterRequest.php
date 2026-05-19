<?php

namespace App\Http\Requests\Auth;

use App\Http\Requests\Auth\Concerns\CanonicalizesTarget;
use App\Models\User;
use App\Rules\Auth\HasVerifiedOtp;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    use CanonicalizesTarget;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->normalizeMobileInput();
    }

    public function rules(): array
    {
        $rules = [
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
                'regex:/^\+?[0-9]{6,11}$/',
                new HasVerifiedOtp($this->canonicalMobile(), 'mobile number'),
            ],
        ];

        // Drivers must upload a profile photo at signup; customers don't.
        if ($this->route('type') === 'driver') {
            $rules['profile_photo'] = ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'];
        }

        return $rules;
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $mobile = $this->canonicalMobile();

            if ($mobile !== '' && User::where('mobile', $mobile)->exists()) {
                $validator->errors()->add('mobile', 'This mobile number is already registered.');
            }
        });
    }
}
