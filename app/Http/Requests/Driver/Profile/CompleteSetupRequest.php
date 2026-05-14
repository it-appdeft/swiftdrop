<?php

namespace App\Http\Requests\Driver\Profile;

use App\Services\Profile\DriverProfileService;
use Illuminate\Foundation\Http\FormRequest;

class CompleteSetupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('sanctum')->check();
    }

    public function rules(): array
    {
        $currentYear = (int) date('Y');

        return [
            // Step 1 - Bank Details
            'account_holder_name' => ['required', 'string', 'min:2', 'max:100'],
            'account_number' => ['required', 'string', 'regex:/^[0-9]{6,12}$/'],
            'sort_code' => ['required', 'string', 'regex:/^[0-9]{2}-?[0-9]{2}-?[0-9]{2}$/'],
            'bank_name' => ['required', 'string', 'min:2', 'max:100'],

            // Step 2 - Vehicle Details
            'vehicle_type' => ['required', 'string', 'in:bicycle,motorcycle,car,van'],
            'vehicle_registration' => ['required', 'string', 'min:2', 'max:20'],
            'vehicle_make' => ['required', 'string', 'min:2', 'max:100'],
            'vehicle_model' => ['required', 'string', 'min:1', 'max:100'],
            'vehicle_color' => ['required', 'string', 'min:2', 'max:50'],
            'year_of_manufacture' => ['required', 'integer', 'between:1950,'.($currentYear + 1)],
            'insurance_type' => ['required', 'string', 'in:comprehensive,third_party,third_party_fire_theft'],
            'insurance_expiry_date' => ['required', 'date', 'after:today'],
            'mot_expiry_date' => ['nullable', 'date'],

            // Step 3 - Documents (all required for first-time submission)
            'documents' => ['required', 'array'],
            'documents.driving_licence_front' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'documents.driving_licence_back' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'documents.id_proof' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'documents.insurance_certificate' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'documents.vehicle_registration_certificate' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'account_number.regex' => 'Account number must be 6-12 digits.',
            'sort_code.regex' => 'Sort code must be in format XX-XX-XX or XXXXXX.',
        ];
    }

    public function bankDetails(): array
    {
        return $this->only([
            'account_holder_name',
            'account_number',
            'sort_code',
            'bank_name',
        ]);
    }

    public function vehicleDetails(): array
    {
        return $this->only([
            'vehicle_type',
            'vehicle_registration',
            'vehicle_make',
            'vehicle_model',
            'vehicle_color',
            'year_of_manufacture',
            'insurance_type',
            'insurance_expiry_date',
            'mot_expiry_date',
        ]);
    }

    public function documentFiles(): array
    {
        $documents = (array) $this->file('documents', []);

        return array_filter(
            $documents,
            fn ($file, $key) => $file !== null
                && in_array($key, DriverProfileService::DOCUMENT_TYPES, true),
            ARRAY_FILTER_USE_BOTH,
        );
    }
}
