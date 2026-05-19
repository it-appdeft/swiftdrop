<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRestaurantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('admin');
    }

    public function rules(): array
    {
        return [
            'name'                => ['required', 'string', 'max:100'],
            'legal_business_name' => ['nullable', 'string', 'max:200'],
            'owner_name'          => ['nullable', 'string', 'max:100'],
            'description'         => ['nullable', 'string'],
            'email'               => ['required', 'email', 'max:255', 'unique:users,email'],
            'mobile'              => ['required', 'string', 'max:20', 'unique:users,mobile'],
            'restaurant_type'     => ['nullable', 'string', 'max:50'],
            'cuisines'            => ['nullable', 'string', 'max:500'],
            'branches'            => ['nullable', 'integer', 'min:1'],
            'seating_capacity'    => ['nullable', 'integer', 'min:0'],
            'full_address'        => ['nullable', 'string', 'max:1000'],
            'lat'                 => ['nullable', 'numeric', 'between:-90,90'],
            'lng'                 => ['nullable', 'numeric', 'between:-180,180'],
            'commission_rate'     => ['required', 'numeric', 'min:0', 'max:100'],
        ];
    }
}
