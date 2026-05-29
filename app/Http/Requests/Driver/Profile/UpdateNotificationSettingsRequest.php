<?php

namespace App\Http\Requests\Driver\Profile;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNotificationSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('sanctum')->check();
    }

    public function rules(): array
    {
        return [
            'notify_delivery_updates' => ['nullable', 'boolean'],
            'notify_general' => ['nullable', 'boolean'],
        ];
    }
}
