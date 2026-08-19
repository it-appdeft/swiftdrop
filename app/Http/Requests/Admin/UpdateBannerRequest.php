<?php

namespace App\Http\Requests\Admin;

class UpdateBannerRequest extends StoreBannerRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'status' => ['required', 'in:active,inactive'],
            'image' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp,svg', 'max:2048'],
        ];
    }
}
