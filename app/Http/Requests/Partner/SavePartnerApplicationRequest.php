<?php

namespace App\Http\Requests\Partner;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates each step's payload when the user clicks Continue. The rules are
 * derived from the `step` field so a single request class serves all four
 * steps of the partner application.
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
                'step' => ['required', 'integer', 'min:1', 'max:4'],
                'data' => ['nullable', 'array'],
            ],
            $this->rulesForStep($step),
        );
    }

    public function messages(): array
    {
        return [
            'data.restaurantName.required' => 'Restaurant name is required.',
            'data.legalName.required' => 'Legal business name is required.',
            'data.ownerName.required' => 'Owner name is required.',
            'data.mobile.required' => 'Mobile number is required.',
            'data.email.required' => 'Email address is required.',
            'data.email.email' => 'Enter a valid email address.',
            'data.restaurantType.required' => 'Restaurant type is required.',
            'data.cuisines.required' => 'Cuisines are required.',
            'data.branches.required' => 'Number of branches is required.',
            'data.branches.regex' => 'Enter a whole number (1 or more).',
            'data.fullAddress.required' => 'Full address is required.',
            'data.gst.required' => 'GST number is required.',
            'data.gst.regex' => 'GST must be 15 alphanumeric characters.',
            'data.fssai.required' => 'FSSAI / Food license is required.',
            'data.fssai.regex' => 'FSSAI / Food license should be 14 digits.',
            'data.pan.required' => 'PAN number is required.',
            'data.pan.regex' => 'PAN format should be ABCDE1234F.',
        ];
    }

    /**
     * Flatten `data.*` validation keys back to the field names the frontend
     * renders, so the same `errors.email` displays the message regardless of
     * whether it came from client or server validation.
     */
    public function attributes(): array
    {
        return [
            'data.restaurantName' => 'restaurantName',
            'data.legalName' => 'legalName',
            'data.ownerName' => 'ownerName',
            'data.mobile' => 'mobile',
            'data.email' => 'email',
            'data.restaurantType' => 'restaurantType',
            'data.cuisines' => 'cuisines',
            'data.branches' => 'branches',
            'data.seating' => 'seating',
            'data.fullAddress' => 'fullAddress',
            'data.gst' => 'gst',
            'data.fssai' => 'fssai',
            'data.pan' => 'pan',
            'data.accountHolder' => 'accountHolder',
            'data.bankName' => 'bankName',
            'data.accountNumber' => 'accountNumber',
            'data.ifsc' => 'ifsc',
        ];
    }

    protected function rulesForStep(int $step): array
    {
        return match ($step) {
            1 => [
                'data.restaurantName' => ['required', 'string', 'max:100'],
                'data.legalName' => ['required', 'string', 'max:200'],
                'data.ownerName' => ['required', 'string', 'max:100'],
                'data.mobile' => ['required', 'string', 'max:20'],
                'data.email' => ['required', 'email', 'max:255'],
                'data.restaurantType' => ['required', 'string', 'max:50'],
                'data.cuisines' => ['required', 'string', 'max:500'],
                'data.branches' => ['required', 'string', 'regex:/^[1-9]\d*$/'],
                'data.seating' => ['nullable', 'string', 'regex:/^\d+$/'],
                'data.fullAddress' => ['required', 'string', 'max:1000'],
            ],
            2 => [
                'data.gst' => ['required', 'string', 'regex:/^[A-Za-z0-9]{15}$/'],
                'data.fssai' => ['required', 'string', 'regex:/^\d{14}$/'],
                'data.pan' => ['required', 'string', 'regex:/^[A-Z]{5}[0-9]{4}[A-Z]$/i'],
                'data.accountHolder' => ['nullable', 'string', 'max:200'],
                'data.bankName' => ['nullable', 'string', 'max:200'],
                'data.accountNumber' => ['nullable', 'string', 'max:50'],
                'data.ifsc' => ['nullable', 'string', 'max:20'],
            ],
            default => [],
        };
    }
}
