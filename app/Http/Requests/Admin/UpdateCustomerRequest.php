<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('admin');
    }

    public function rules(): array
    {
        $customerId = $this->route('id');

        return [
            'first_name'    => ['required', 'string', 'max:100'],
            'last_name'     => ['required', 'string', 'max:100'],
            'mobile'        => ['required', 'string', 'max:20', Rule::unique('users', 'mobile')->ignore($customerId)],
            'email'         => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($customerId)],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'status'        => ['required', Rule::in(['active', 'suspended', 'pending_approval'])],
        ];
    }
}
