<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\Auth\Concerns\CanonicalizesTarget;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Rules\Auth\ValidCountryIso;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCustomerRequest extends FormRequest
{
    use CanonicalizesTarget;

    public function authorize(): bool
    {
        return $this->user()->hasRole('admin');
    }

    protected function prepareForValidation(): void
    {
        $this->normalizeMobileInput();
        $this->normalizeCountryIso();
    }

    public function rules(): array
    {
        $customerId = $this->route('id');

        return [
            'first_name'    => ['required', 'string', 'max:100'],
            'last_name'     => ['required', 'string', 'max:100'],
            'country_code'  => ['required', 'string', 'regex:/^\+[0-9]{1,4}$/'],
            'country_iso'   => ['required', 'string', 'size:2', new ValidCountryIso()],
            'mobile'        => ['required', 'string', 'regex:/^\+?[0-9]{6,11}$/'],
            'email'         => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($customerId)],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'status'        => ['required', Rule::in(['active', 'suspended', 'pending_approval'])],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            // Mobile uniqueness on the canonical (country_code + subscriber)
            // form, ignoring the customer being edited.
            $canonical = $this->canonicalMobile();

            if ($canonical === '') {
                return;
            }

            $existing = app(UserRepositoryInterface::class)->findByMobile($canonical);

            if ($existing && (int) $existing->id !== (int) $this->route('id')) {
                $validator->errors()->add('mobile', 'This mobile number is already registered.');
            }
        });
    }
}
