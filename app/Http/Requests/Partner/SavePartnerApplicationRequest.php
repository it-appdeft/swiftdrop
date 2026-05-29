<?php

namespace App\Http\Requests\Partner;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Per-step validation for the 6-step partner application:
 *
 *   1. Account & Restaurant — owner identity + restaurant basics
 *   2. Location & Hours      — address + per-day operating hours
 *   3. Legal & Bank          — GST/FSSAI/PAN + payout account
 *   4. Documents             — file uploads (separate endpoint)
 *   5. Menu starter          — array of signature dishes
 *   6. Review & Submit       — terms checkbox (separate endpoint)
 */
class SavePartnerApplicationRequest extends FormRequest
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
                'step' => ['required', 'integer', 'min:1', 'max:6'],
                'data' => ['nullable', 'array'],
            ],
            $this->rulesForStep($step),
        );
    }

    public function attributes(): array
    {
        return [
            'data.ownerName' => 'ownerName',
            'data.contactEmail' => 'contactEmail',
            'data.contactPhone' => 'contactPhone',
            'data.restaurantName' => 'restaurantName',
            'data.legalName' => 'legalName',
            'data.restaurantType' => 'restaurantType',
            'data.foodTypeIds' => 'foodTypeIds',
            'data.branches' => 'branches',
            'data.seating' => 'seating',
            'data.fullAddress' => 'fullAddress',
            'data.city' => 'city',
            'data.pinCode' => 'pinCode',
            'data.hours' => 'hours',
            'data.gst' => 'gst',
            'data.fssai' => 'fssai',
            'data.pan' => 'pan',
            'data.bankAccountHolder' => 'bankAccountHolder',
            'data.bankName' => 'bankName',
            'data.accountNumber' => 'accountNumber',
            'data.ifsc' => 'ifsc',
            'data.categories' => 'categories',
        ];
    }

    public function messages(): array
    {
        return [
            'data.ownerName.required' => 'Owner name is required.',
            'data.contactEmail.required' => 'Email is required.',
            'data.contactEmail.email' => 'Enter a valid email address.',
            'data.contactPhone.required' => 'Mobile number is required.',
            'data.restaurantName.required' => 'Restaurant name is required.',
            'data.fullAddress.required' => 'Full address is required.',
            'data.city.required' => 'City is required.',
            'data.pinCode.required' => 'PIN code is required.',
            'data.gst.regex' => 'GST must be 15 alphanumeric characters.',
            'data.fssai.regex' => 'FSSAI should be 14 digits.',
            'data.pan.regex' => 'PAN format should be ABCDE1234F.',
            'data.accountNumber.regex' => 'Account number must be 6–20 digits with no letters or spaces.',
        ];
    }

    protected function rulesForStep(int $step): array
    {
        return match ($step) {
            1 => [
                'data.ownerName' => ['required', 'string', 'max:100'],
                // Email + mobile are read-only in the UI; the controller takes the
                // authoritative values from the auth user. Accepted here only so
                // the round-trip payload validates.
                'data.contactEmail' => ['nullable', 'email', 'max:255'],
                'data.contactPhone' => ['nullable', 'string', 'max:20'],
                'data.contactCountryCode' => ['nullable', 'string', 'max:10'],
                'data.restaurantName' => ['required', 'string', 'max:100'],
                'data.legalName' => ['nullable', 'string', 'max:200'],
                'data.restaurantType' => ['nullable', 'string', 'max:50'],
                // Food categories — the partner picks from the admin-managed
                // `food_types` catalog. Existence is enforced at the writer.
                'data.foodTypeIds' => ['nullable', 'array', 'max:50'],
                'data.foodTypeIds.*' => ['integer', 'exists:food_types,id'],
                'data.branches' => ['nullable', 'integer', 'min:1', 'max:1000'],
                'data.seating' => ['nullable', 'integer', 'min:0'],
            ],
            2 => [
                'data.fullAddress' => ['required', 'string', 'max:1000'],
                'data.city' => ['required', 'string', 'max:120'],
                'data.pinCode' => ['required', 'string', 'max:12'],
                'data.lat' => ['nullable', 'numeric', 'between:-90,90'],
                'data.lng' => ['nullable', 'numeric', 'between:-180,180'],
                'data.hours' => ['nullable', 'array'],
                'data.hours.*.open' => ['nullable', 'boolean'],
                'data.hours.*.from' => ['nullable', 'date_format:H:i'],
                'data.hours.*.to' => ['nullable', 'date_format:H:i'],
            ],
            3 => [
                'data.gst' => ['required', 'string', 'regex:/^[A-Za-z0-9]{15}$/'],
                'data.fssai' => ['required', 'string', 'regex:/^\d{14}$/'],
                'data.pan' => ['required', 'string', 'regex:/^[A-Z]{5}[0-9]{4}[A-Z]$/i'],
                'data.bankAccountHolder' => ['nullable', 'string', 'max:200'],
                'data.bankName' => ['nullable', 'string', 'max:200'],
                // Bank account numbers vary by country (Indian: typically 9–18
                // digits, generally 6–20 covers the realistic range). Digits
                // only — the UI strips non-digits before submit.
                'data.accountNumber' => ['nullable', 'string', 'regex:/^\d{6,20}$/'],
                'data.ifsc' => ['nullable', 'string', 'max:20'],
            ],
            5 => [
                'data.categories' => ['nullable', 'array', 'max:50'],
                'data.categories.*.name' => ['nullable', 'string', 'max:120'],
                'data.categories.*.diet' => ['nullable', Rule::in(['veg', 'non_veg'])],
            ],
            default => [], // Step 4 (documents) + Step 6 (review) post no data
        };
    }
}
