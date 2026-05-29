<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRestaurantRequest extends FormRequest
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
            'owner_email'         => ['nullable', 'email', 'max:255'],
            'owner_mobile'        => ['nullable', 'string', 'max:20'],
            'description'         => ['nullable', 'string'],
            'restaurant_type'     => ['nullable', 'string', 'max:50'],
            'cuisines'            => ['nullable', 'string', 'max:500'],
            'branches'            => ['nullable', 'integer', 'min:1'],
            'seating_capacity'    => ['nullable', 'integer', 'min:0'],
            'full_address'        => ['nullable', 'string', 'max:1000'],
            'lat'                 => ['nullable', 'numeric', 'between:-90,90'],
            'lng'                 => ['nullable', 'numeric', 'between:-180,180'],
            'commission_rate'     => ['required', 'numeric', 'min:0', 'max:100'],
            'status'              => ['required', Rule::in(['pending_approval', 'active', 'inactive', 'suspended'])],
            'approval_status'     => ['required', Rule::in(['pending', 'approved', 'rejected'])],
        ];
    }
}
