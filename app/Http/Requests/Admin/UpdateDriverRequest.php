<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDriverRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('admin');
    }

    public function rules(): array
    {
        $driverId = $this->route('id');

        return [
            'first_name'           => ['required', 'string', 'max:100'],
            'last_name'            => ['required', 'string', 'max:100'],
            'mobile'               => ['required', 'string', 'max:20', Rule::unique('users', 'mobile')->ignore($driverId)],
            'email'                => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($driverId)],
            'vehicle_type'         => ['required', Rule::in(['bicycle', 'motorcycle', 'car', 'van'])],
            'vehicle_make'         => ['nullable', 'string', 'max:100'],
            'vehicle_model'        => ['nullable', 'string', 'max:100'],
            'vehicle_registration' => ['required', 'string', 'max:20'],
            'status'               => ['required', Rule::in(['active', 'suspended', 'pending_approval'])],
            'approval_status'      => ['required', Rule::in(['pending', 'approved', 'rejected'])],
        ];
    }
}
