<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreBannerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('admin');
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'status' => ['required', 'in:active,inactive'],
            'image' => ['required', 'image', 'mimes:jpeg,jpg,png,webp,svg', 'max:2048'],
        ];
    }
}
