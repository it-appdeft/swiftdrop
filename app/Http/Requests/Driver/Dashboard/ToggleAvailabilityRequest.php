<?php

namespace App\Http\Requests\Driver\Dashboard;

use Illuminate\Foundation\Http\FormRequest;

class ToggleAvailabilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'availability' => ['required', 'string', 'in:online,offline'],
        ];
    }

    public function availability(): string
    {
        return (string) $this->input('availability');
    }
}
