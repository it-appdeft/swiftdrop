<?php

namespace App\Http\Requests\Partner;

use App\Models\Restaurant;
use App\Models\RestaurantDocument;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Final-step validation that runs when the user submits the partner
 * application. Verifies the full payload AND that every required document
 * has already been uploaded to the restaurant's record.
 */
class SubmitPartnerApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'data' => ['required', 'array'],
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
            'data.gst' => ['required', 'string', 'regex:/^[A-Za-z0-9]{15}$/'],
            'data.fssai' => ['required', 'string', 'regex:/^\d{14}$/'],
            'data.pan' => ['required', 'string', 'regex:/^[A-Z]{5}[0-9]{4}[A-Z]$/i'],
            'data.termsAccepted' => ['accepted'],
        ];
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
            'data.termsAccepted.accepted' => 'You must accept the partner terms to submit.',
        ];
    }

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
            'data.termsAccepted' => 'termsAccepted',
        ];
    }

    /**
     * Stitch in the documents check — these live in the restaurant record,
     * not the request payload, so they need a custom rule.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $restaurant = $this->user()?->restaurant()->with('applicationDocuments')->first();

            if (! $restaurant instanceof Restaurant) {
                return;
            }

            $row = $restaurant->applicationDocuments;

            foreach (RestaurantDocument::TYPE_TO_COLUMN as $key => $column) {
                if (! $row || blank($row->{$column})) {
                    $v->errors()->add("doc.{$key}", 'Document is required.');
                }
            }
        });
    }
}
