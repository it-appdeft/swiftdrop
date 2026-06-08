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
            'base_delivery_fee_gbp' => ['required', 'numeric', 'min:0', 'max:100'],
            'delivery_fee_per_mile_gbp' => ['required', 'numeric', 'min:0', 'max:100'],
            'free_delivery_threshold_gbp' => ['required', 'numeric', 'min:0', 'max:1000'],
            'order_tax_rate_percent' => ['required', 'numeric', 'min:0', 'max:100'],
            'delivery_request_timeout_seconds' => ['required', 'integer', 'min:5', 'max:300'],
        ];
    }
}
