<?php

namespace App\Http\Requests\Driver\Dashboard;

use Illuminate\Foundation\Http\FormRequest;

class RespondToDeliveryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'action' => ['required', 'string', 'in:accept,reject'],
        ];
    }

    public function action(): string
    {
        return (string) $this->input('action');
    }
}
