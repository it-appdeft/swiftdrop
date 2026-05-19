<?php

namespace App\Http\Requests\Partner;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UploadPartnerDocumentRequest extends FormRequest
{
    private const ALLOWED_TYPES = [
        'gstCert',
        'fssai',
        'pan',
        'cancelledCheque',
        'ownerId',
        'menu',
    ];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(self::ALLOWED_TYPES)],
            'file' => ['required', 'file', 'max:5120', 'mimes:pdf,jpg,jpeg,png'],
        ];
    }

    /**
     * Pull the {type} route param into the payload so it can be validated.
     */
    protected function prepareForValidation(): void
    {
        $this->merge(['type' => $this->route('type')]);
    }

    public function documentType(): string
    {
        return (string) $this->input('type');
    }

    public function messages(): array
    {
        return [
            'file.required' => 'Please select a file to upload.',
            'file.max' => 'File must be 5MB or smaller.',
            'file.mimes' => 'Allowed formats: PDF, JPG, JPEG, PNG.',
            'type.in' => 'Unknown document type.',
        ];
    }
}
