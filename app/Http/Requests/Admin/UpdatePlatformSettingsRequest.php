<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePlatformSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('admin');
    }

    public function rules(): array
    {
        return [
            'customer_dashboard_radius_miles' => ['required', 'numeric', 'min:0.5', 'max:200'],
            'customer_dashboard_fallback_limit' => ['required', 'integer', 'min:1', 'max:100'],
        ];
    }
}
