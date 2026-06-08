<?php

namespace App\Http\Requests\Driver\Dashboard;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLocationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lng' => ['required', 'numeric', 'between:-180,180'],
        ];
    }

    public function lat(): float
    {
        return (float) $this->input('lat');
    }

    public function lng(): float
    {
        return (float) $this->input('lng');
    }
}
