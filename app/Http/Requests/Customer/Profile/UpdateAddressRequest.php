<?php

namespace App\Http\Requests\Customer\Profile;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check() || auth('sanctum')->check();
    }

    public function rules(): array
    {
        return [
            'label' => ['nullable', 'string', 'in:Home,Work,Other', 'max:50'],
            'address_line_1' => ['nullable', 'string', 'min:5', 'max:255'],
            'address_line_2' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'min:2', 'max:100'],
            'county' => ['nullable', 'string', 'min:2', 'max:100'],
            'postcode' => ['nullable', 'string', 'regex:/^[a-zA-Z0-9\s\-]{3,20}$/', 'max:20'],
            'lat' => ['nullable', 'numeric', 'between:-90,90'],
            'lng' => ['nullable', 'numeric', 'between:-180,180'],
            'is_default' => ['nullable', 'boolean'],
        ];
    }
}
