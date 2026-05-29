<?php

namespace App\Http\Requests\Driver\Profile;

use App\Services\Profile\DriverProfileService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UploadSingleDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('sanctum')->check();
    }

    public function rules(): array
    {
        return [
            'type' => ['required', 'string', Rule::in(DriverProfileService::DOCUMENT_TYPES)],
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'expires_at' => ['nullable', 'date'],
        ];
    }
}
