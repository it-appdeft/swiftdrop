<?php

namespace App\Http\Requests\Partner;

use App\Models\RestaurantDocument;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Document slots accepted by the partner-application flow — six fixed paths
 * (GST cert, FSSAI, PAN, cancelled cheque, owner ID, menu) keyed off
 * {@see RestaurantDocument::TYPE_TO_COLUMN}.
 */
class UploadPartnerDocumentRequest extends FormRequest
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
