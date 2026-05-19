<?php

namespace App\Http\Requests\Driver\Profile;

use App\Http\Requests\Concerns\ResolvesVehicleTypeRequirements;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateVehicleDetailsRequest extends FormRequest
{
    use ResolvesVehicleTypeRequirements;

    public function authorize(): bool
    {
        return auth('sanctum')->check();
    }

    public function rules(): array
    {
        $currentYear = (int) date('Y');
        $insuranceRule = $this->requiresInsurance() ? 'required' : 'nullable';

        return [
            'step'                  => ['required', 'integer'],
            'vehicle_type'          => [
                'required',
                'string',
                Rule::exists('vehicle_types', 'slug')->where('is_active', true),
            ],
            'vehicle_registration'  => ['required', 'string', 'min:2', 'max:20'],
            'vehicle_make'          => ['required', 'string', 'min:2', 'max:100'],
            'vehicle_model'         => ['required', 'string', 'min:1', 'max:100'],
            'vehicle_color'         => ['required', 'string', 'min:2', 'max:50'],
            'year_of_manufacture'   => ['required', 'integer', 'between:1950,'.($currentYear + 1)],
            'insurance_type'        => [$insuranceRule, 'string', 'in:comprehensive,third_party,third_party_fire_theft'],
            'insurance_expiry_date' => [$insuranceRule, 'date', 'after:today'],
            'mot_expiry_date'       => ['nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'vehicle_type.exists' => 'Selected vehicle type is invalid.',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $year = (int) $this->input('year_of_manufacture');

            if ($year && (now()->year - $year) > 3) {
                if (empty($this->input('mot_expiry_date'))) {
                    $validator->errors()->add(
                        'mot_expiry_date',
                        'MOT expiry date is required for vehicles over 3 years old.',
                    );
                }
            }
        });
    }
}
