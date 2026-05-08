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
        $restaurantId = $this->route('id');

        return [
            'name'            => ['required', 'string', 'max:255'],
            'description'     => ['nullable', 'string'],
            'phone'           => ['required', 'string', 'max:20'],
            'address_line_1'  => ['required', 'string', 'max:255'],
            'address_line_2'  => ['nullable', 'string', 'max:255'],
            'city'            => ['required', 'string', 'max:100'],
            'county'          => ['nullable', 'string', 'max:100'],
            'postcode'        => ['required', 'string', 'max:10'],
            'lat'             => ['required', 'numeric'],
            'lng'             => ['required', 'numeric'],
            'cuisine_type'    => ['nullable', 'string', 'max:100'],
            'commission_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'vat_number'      => ['nullable', 'string', 'max:50'],
            'status'          => ['required', Rule::in(['pending_approval', 'active', 'inactive', 'suspended'])],
            'approval_status' => ['required', Rule::in(['pending', 'approved', 'rejected'])],
        ];
    }
}
