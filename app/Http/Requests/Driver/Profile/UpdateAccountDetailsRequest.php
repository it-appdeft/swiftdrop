<?php

namespace App\Http\Requests\Driver\Profile;

use App\Http\Requests\Concerns\ResolvesVehicleTypeRequirements;
use App\Services\Profile\DriverProfileService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAccountDetailsRequest extends FormRequest
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
        $licenceRule = $this->requiresDrivingLicence() ? 'sometimes' : 'nullable';
        $insuranceDocRule = $this->requiresInsurance() ? 'sometimes' : 'nullable';

        return [
            // Bank details
            'account_holder_name' => ['sometimes', 'required', 'string', 'min:2', 'max:100'],
            'account_number'      => ['sometimes', 'required', 'string', 'regex:/^[0-9]{6,12}$/'],
            'sort_code'           => ['sometimes', 'required', 'string', 'regex:/^[0-9]{2}-?[0-9]{2}-?[0-9]{2}$/'],
            'bank_name'           => ['sometimes', 'required', 'string', 'min:2', 'max:100'],

            // Vehicle details
            'vehicle_type'          => [
                'sometimes',
                'required',
                'string',
                Rule::exists('vehicle_types', 'slug')->where('is_active', true),
            ],
            'vehicle_registration'  => ['sometimes', 'required', 'string', 'min:2', 'max:20'],
            'vehicle_make'          => ['sometimes', 'required', 'string', 'min:2', 'max:100'],
            'vehicle_model'         => ['sometimes', 'required', 'string', 'min:1', 'max:100'],
            'vehicle_color'         => ['sometimes', 'required', 'string', 'min:2', 'max:50'],
            'year_of_manufacture'   => ['sometimes', 'required', 'integer', 'between:1950,'.($currentYear + 1)],
            'insurance_type'        => ['sometimes', $insuranceRule, 'string', 'in:comprehensive,third_party,third_party_fire_theft'],
            'insurance_expiry_date' => ['sometimes', $insuranceRule, 'date', 'after:today'],
            'mot_expiry_date'       => ['nullable', 'date'],

            // Documents — only re-uploaded ones are present; whether they
            // are required at all depends on the vehicle type.
            'documents'                                  => ['sometimes', 'array'],
            'documents.driving_licence_front'            => [$licenceRule, 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'documents.driving_licence_back'             => [$licenceRule, 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'documents.id_proof'                         => ['sometimes', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'documents.insurance_certificate'            => [$insuranceDocRule, 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'documents.vehicle_registration_certificate' => ['sometimes', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'account_number.regex' => 'Account number must be 6-12 digits.',
            'sort_code.regex' => 'Sort code must be in format XX-XX-XX or XXXXXX.',
            'vehicle_type.exists' => 'Selected vehicle type is invalid.',
        ];
    }

    /**
     * Additional cross-field checks:
     *  - MOT required when vehicle is older than 3 years (uses submitted
     *    or existing year so MOT can't be cleared on an older bike/car).
     *  - For vehicle types that need a driving licence / insurance
     *    certificate, the docs must either be uploaded now or already
     *    exist on the profile (so a driver switching from bicycle to
     *    motorbike has to supply the missing files).
     *  - Unknown document keys are rejected.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $profile = auth('sanctum')->user()?->driverProfile;

            $year = (int) ($this->input('year_of_manufacture') ?? optional($profile)->year_of_manufacture);
            if ($year && (now()->year - $year) > 3 && empty($this->input('mot_expiry_date'))) {
                $validator->errors()->add(
                    'mot_expiry_date',
                    'MOT expiry date is required for vehicles over 3 years old.',
                );
            }

            $documents = (array) $this->file('documents', []);

            foreach (array_keys($documents) as $key) {
                if (! in_array($key, DriverProfileService::DOCUMENT_TYPES, true)) {
                    $validator->errors()->add(
                        "documents.{$key}",
                        'Invalid document type. Allowed: '.implode(', ', DriverProfileService::DOCUMENT_TYPES),
                    );
                }
            }

            if ($this->requiresDrivingLicence()) {
                foreach (['driving_licence_front', 'driving_licence_back'] as $type) {
                    if (! $this->documentPresentOrExisting($type, $profile)) {
                        $validator->errors()->add(
                            "documents.{$type}",
                            "Document `{$type}` is required for the selected vehicle type.",
                        );
                    }
                }
            }

            if ($this->requiresInsurance()) {
                if (! $this->documentPresentOrExisting('insurance_certificate', $profile)) {
                    $validator->errors()->add(
                        'documents.insurance_certificate',
                        'Document `insurance_certificate` is required for the selected vehicle type.',
                    );
                }
            }
        });
    }

    public function validatedDocuments(): array
    {
        $documents = (array) $this->file('documents', []);
        $skipKeys = $this->skippedDocumentTypes();

        return array_filter(
            $documents,
            fn ($_, $key) => in_array($key, DriverProfileService::DOCUMENT_TYPES, true)
                && ! in_array($key, $skipKeys, true),
            ARRAY_FILTER_USE_BOTH,
        );
    }

    public function validatedFields(): array
    {
        $data = $this->validated();
        unset($data['documents']);

        // For vehicles that don't carry insurance, blank out the insurance
        // fields even if a stale value was sent, so the persisted profile
        // matches the selected vehicle type.
        if (! $this->requiresInsurance() && $this->input('vehicle_type') !== null) {
            $data['insurance_type'] = null;
            $data['insurance_expiry_date'] = null;
        }

        return $data;
    }

    protected function skippedDocumentTypes(): array
    {
        $skip = [];

        if (! $this->requiresDrivingLicence()) {
            $skip[] = 'driving_licence_front';
            $skip[] = 'driving_licence_back';
        }

        if (! $this->requiresInsurance()) {
            $skip[] = 'insurance_certificate';
        }

        return $skip;
    }

    protected function documentPresentOrExisting(string $type, $profile): bool
    {
        if ($this->hasFile("documents.{$type}")) {
            return true;
        }

        if (! $profile) {
            return false;
        }

        return $profile->documents()->where('type', $type)->exists();
    }
}
