<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('admin');
    }

    public function rules(): array
    {
        return [
            'first_name'   => ['required', 'string', 'max:100'],
            'last_name'    => ['required', 'string', 'max:100'],
            'mobile'       => ['required', 'string', 'max:20', 'unique:users,mobile'],
            'email'        => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
        ];
    }
}
