<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDriverRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('admin');
    }

    public function rules(): array
    {
        return [
            'first_name'           => ['required', 'string', 'max:100'],
            'last_name'            => ['required', 'string', 'max:100'],
            'mobile'               => ['required', 'string', 'max:20', 'unique:users,mobile'],
            'email'                => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'vehicle_type'         => ['required', Rule::in(['bicycle', 'motorcycle', 'car', 'van'])],
            'vehicle_make'         => ['nullable', 'string', 'max:100'],
            'vehicle_model'        => ['nullable', 'string', 'max:100'],
            'vehicle_registration' => ['required', 'string', 'max:20'],
        ];
    }
}
