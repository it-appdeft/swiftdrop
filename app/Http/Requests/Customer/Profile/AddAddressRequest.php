<?php

namespace App\Http\Requests\Customer\Profile;

use Illuminate\Foundation\Http\FormRequest;

class AddAddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('sanctum')->check();
    }

    public function rules(): array
    {
        return [
            'label' => ['required', 'string', 'in:Home,Work,Other', 'max:50'],
            'address_line_1' => ['required', 'string', 'min:5', 'max:255'],
            'address_line_2' => ['nullable', 'string', 'max:255'],
            'city' => ['required', 'string', 'min:2', 'max:100'],
            'county' => ['required', 'string', 'min:2', 'max:100'],
            'postcode' => ['required', 'string', 'regex:/^[a-zA-Z0-9\s\-]{3,20}$/', 'max:20'],
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lng' => ['required', 'numeric', 'between:-180,180'],
            'is_default' => ['nullable', 'boolean'],
        ];
    }
}
