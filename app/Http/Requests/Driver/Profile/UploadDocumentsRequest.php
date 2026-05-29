<?php

namespace App\Http\Requests\Driver\Profile;

use App\Http\Requests\Concerns\ResolvesVehicleTypeRequirements;
use App\Services\Profile\DriverProfileService;
use Illuminate\Foundation\Http\FormRequest;

class UploadDocumentsRequest extends FormRequest
{
    use ResolvesVehicleTypeRequirements;

    public function authorize(): bool
    {
        return auth('sanctum')->check();
    }

    public function rules(): array
    {
        $licenceRule = $this->requiresDrivingLicence() ? 'required' : 'nullable';
        $insuranceRule = $this->requiresInsurance() ? 'required' : 'nullable';

        return [
            'step'                                          => ['required', 'integer'],
            'documents'                                     => ['required', 'array', 'min:1'],
            'documents.driving_licence_front'               => [$licenceRule, 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'documents.driving_licence_back'                => [$licenceRule, 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'documents.id_proof'                            => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'documents.insurance_certificate'               => [$insuranceRule, 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'documents.vehicle_registration_certificate'    => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ];
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

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $documents = (array) $this->file('documents', []);

            foreach (array_keys($documents) as $key) {
                if (! in_array($key, DriverProfileService::DOCUMENT_TYPES, true)) {
                    $validator->errors()->add(
                        "documents.{$key}",
                        'Invalid document type. Allowed: '.implode(', ', DriverProfileService::DOCUMENT_TYPES),
                    );
                }
            }
        });
    }

    /**
     * Document keys that should be discarded for the resolved vehicle type
     * (e.g. licence + insurance docs for a bicycle).
     */
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
}
