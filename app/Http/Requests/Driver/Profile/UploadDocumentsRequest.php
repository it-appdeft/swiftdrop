<?php

namespace App\Http\Requests\Driver\Profile;

use App\Services\Profile\DriverProfileService;
use Illuminate\Foundation\Http\FormRequest;

class UploadDocumentsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('sanctum')->check();
    }

    public function rules(): array
    {
        return [
            'documents' => ['required', 'array', 'min:1'],
            'documents.*' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ];
    }

    public function validatedDocuments(): array
    {
        $documents = (array) $this->file('documents', []);

        return array_filter(
            $documents,
            fn ($_, $key) => in_array($key, DriverProfileService::DOCUMENT_TYPES, true),
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
                        "Invalid document type. Allowed: ".implode(', ', DriverProfileService::DOCUMENT_TYPES),
                    );
                }
            }
        });
    }
}
