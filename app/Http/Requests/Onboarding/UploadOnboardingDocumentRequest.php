<?php

namespace App\Http\Requests\Onboarding;

use App\Models\RestaurantDocument;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Document slots accepted during onboarding — same fixed set used by the
 * partner-application flow, plus `cancelledCheque`.
 */
class UploadOnboardingDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['type' => $this->route('type')]);
    }

    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(array_keys(RestaurantDocument::TYPE_TO_COLUMN))],
            'file' => ['required', 'file', 'max:5120', 'mimes:pdf,jpg,jpeg,png'],
        ];
    }

    public function documentType(): string
    {
        return (string) $this->input('type');
    }
}
