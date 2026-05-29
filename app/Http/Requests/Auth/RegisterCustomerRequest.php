<?php

namespace App\Http\Requests\Auth;

use App\Http\Requests\Auth\Concerns\CanonicalizesTarget;
use App\Models\User;
use App\Rules\Auth\HasVerifiedOtp;
use App\Rules\Auth\ValidCountryIso;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class RegisterCustomerRequest extends FormRequest
{
    use CanonicalizesTarget;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->normalizeMobileInput();
        $this->normalizeCountryIso();
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
            // Required — the web form always sends the exact ISO the user picked,
            // persisted verbatim instead of derived from the dial code.
            'country_iso' => ['required', 'string', 'size:2', new ValidCountryIso()],
            'mobile' => [
                'required',
                'string',
                'regex:/^\+?[0-9]{6,11}$/',
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
