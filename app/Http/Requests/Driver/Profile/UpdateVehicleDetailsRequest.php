<?php

namespace App\Http\Requests\Driver\Profile;

use Illuminate\Foundation\Http\FormRequest;

class UpdateVehicleDetailsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('sanctum')->check();
    }

    public function rules(): array
    {
        $currentYear = (int) date('Y');

        return [
            'vehicle_type' => ['required', 'string', 'in:bicycle,motorcycle,car,van'],
            'vehicle_registration' => ['required', 'string', 'min:2', 'max:20'],
            'vehicle_make' => ['nullable', 'string', 'min:2', 'max:100'],
            'vehicle_model' => ['nullable', 'string', 'min:1', 'max:100'],
            'vehicle_color' => ['nullable', 'string', 'min:2', 'max:50'],
            'year_of_manufacture' => ['nullable', 'integer', 'between:1950,'.($currentYear + 1)],
            'insurance_type' => ['nullable', 'string', 'in:comprehensive,third_party,third_party_fire_theft'],
            'insurance_expiry_date' => ['nullable', 'date', 'after:today'],
            'mot_expiry_date' => ['nullable', 'date'],
        ];
    }
}
