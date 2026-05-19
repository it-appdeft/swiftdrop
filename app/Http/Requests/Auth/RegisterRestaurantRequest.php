<?php

namespace App\Http\Requests\Auth;

use App\Http\Requests\Auth\Concerns\CanonicalizesTarget;
use App\Models\User;
use App\Rules\Auth\HasVerifiedOtp;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class RegisterRestaurantRequest extends FormRequest
{
    use CanonicalizesTarget;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Restaurant signup now only captures the same fields as customer
        // signup — Name, Email, Mobile. Everything else is collected by the
        // partner application flow after registration.
        return [
            'name' => ['required', 'string', 'min:2', 'max:255'],
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
                'regex:/^\+?[0-9\s\-]{6,20}$/',
                new HasVerifiedOtp($this->canonicalMobile(), 'mobile number'),
            ],
        ];
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
