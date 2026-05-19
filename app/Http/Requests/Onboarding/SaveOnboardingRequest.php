<?php

namespace App\Http\Requests\Onboarding;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Per-step validation for the partner-onboarding flow. The `step` field
 * controls which subset of `data.*` rules apply, so a single request class
 * serves every step that posts text data (uploads go via dedicated requests).
 */
class SaveOnboardingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $step = (int) $this->input('step');

        return array_merge(
            [
                'step' => ['required', 'integer', 'min:1', 'max:8'],
                'data' => ['nullable', 'array'],
            ],
            $this->rulesForStep($step),
        );
    }

    public function attributes(): array
    {
        return [
            'data.displayName' => 'displayName',
            'data.tagline' => 'tagline',
            'data.description' => 'description',
            'data.contactEmail' => 'contactEmail',
            'data.contactPhone' => 'contactPhone',
            'data.address' => 'address',
            'data.cuisines' => 'cuisines',
            'data.deliveryRadius' => 'deliveryRadius',
            'data.avgPrepTime' => 'avgPrepTime',
            'data.minOrderAmount' => 'minOrderAmount',
            'data.avgTicketSize' => 'avgTicketSize',
            'data.hours' => 'hours',
            'data.autoAccept' => 'autoAccept',
            'data.estimatedPrepTime' => 'estimatedPrepTime',
            'data.packagingCharges' => 'packagingCharges',
            'data.taxType' => 'taxType',
            'data.cancellationCutoff' => 'cancellationCutoff',
            'data.bankAccountHolder' => 'bankAccountHolder',
            'data.bankName' => 'bankName',
            'data.accountNumber' => 'accountNumber',
            'data.ifsc' => 'ifsc',
            'data.gst' => 'gst',
            'data.fssai' => 'fssai',
            'data.pan' => 'pan',
        ];
    }

    public function messages(): array
    {
        return [
            'data.displayName.required' => 'Display name is required.',
            'data.contactEmail.email' => 'Enter a valid email address.',
            'data.cuisines.required' => 'Pick at least one cuisine.',
            'data.cuisines.array' => 'Pick at least one cuisine.',
            'data.cuisines.min' => 'Pick at least one cuisine.',
            'data.deliveryRadius.required' => 'Set a delivery radius.',
            'data.deliveryRadius.between' => 'Delivery radius must be between 1 and 50 km.',
            'data.hours.required' => 'Operating hours are required.',
            'data.bankAccountHolder.required' => 'Account holder name is required.',
            'data.bankName.required' => 'Bank name is required.',
            'data.accountNumber.required' => 'Account number is required.',
            'data.ifsc.required' => 'IFSC code is required.',
            'data.gst.required' => 'GST is required.',
            'data.gst.regex' => 'GST must be 15 alphanumeric characters.',
            'data.fssai.required' => 'FSSAI is required.',
            'data.fssai.regex' => 'FSSAI should be 14 digits.',
            'data.pan.required' => 'PAN is required.',
            'data.pan.regex' => 'PAN format should be ABCDE1234F.',
        ];
    }

    protected function rulesForStep(int $step): array
    {
        return match ($step) {
            1 => [
                'data.displayName' => ['required', 'string', 'max:100'],
                'data.tagline' => ['nullable', 'string', 'max:255'],
                'data.description' => ['nullable', 'string', 'max:2000'],
                'data.contactEmail' => ['nullable', 'email', 'max:255'],
                'data.contactPhone' => ['nullable', 'string', 'max:20'],
                'data.address' => ['nullable', 'string', 'max:1000'],
            ],
            2 => [
                // Step 2 (Branding) is entirely file-based — uploads handled
                // by UploadOnboardingImageRequest. No text data to validate.
            ],
            3 => [
                'data.cuisines' => ['required', 'array', 'min:1'],
                'data.cuisines.*' => ['string', 'max:50'],
                'data.deliveryRadius' => ['required', 'integer', 'between:1,50'],
                'data.avgPrepTime' => ['nullable', 'integer', 'min:0', 'max:600'],
                'data.minOrderAmount' => ['nullable', 'numeric', 'min:0'],
                'data.avgTicketSize' => ['nullable', 'numeric', 'min:0'],
            ],
            4 => [
                'data.hours' => ['required', 'array'],
                'data.hours.mon' => ['required', 'array'],
                'data.hours.tue' => ['required', 'array'],
                'data.hours.wed' => ['required', 'array'],
                'data.hours.thu' => ['required', 'array'],
                'data.hours.fri' => ['required', 'array'],
                'data.hours.sat' => ['required', 'array'],
                'data.hours.sun' => ['required', 'array'],
                'data.hours.*.open' => ['required', 'boolean'],
                'data.hours.*.from' => ['required_if:data.hours.*.open,true', 'nullable', 'date_format:H:i'],
                'data.hours.*.to' => ['required_if:data.hours.*.open,true', 'nullable', 'date_format:H:i'],
            ],
            5 => [
                'data.autoAccept' => ['required', 'boolean'],
                'data.estimatedPrepTime' => ['nullable', 'integer', 'min:0', 'max:600'],
                'data.packagingCharges' => ['nullable', 'numeric', 'min:0'],
                'data.taxType' => ['nullable', 'string', 'max:50'],
                'data.cancellationCutoff' => ['nullable', 'integer', 'min:0', 'max:60'],
            ],
            6 => [
                'data.bankAccountHolder' => ['required', 'string', 'max:200'],
                'data.bankName' => ['required', 'string', 'max:200'],
                'data.accountNumber' => ['required', 'string', 'max:50'],
                'data.ifsc' => ['required', 'string', 'max:20'],
            ],
            7 => [
                'data.gst' => ['required', 'string', 'regex:/^[A-Za-z0-9]{15}$/'],
                'data.fssai' => ['required', 'string', 'regex:/^\d{14}$/'],
                'data.pan' => ['required', 'string', 'regex:/^[A-Z]{5}[0-9]{4}[A-Z]$/i'],
            ],
            default => [],
        };
    }
}
