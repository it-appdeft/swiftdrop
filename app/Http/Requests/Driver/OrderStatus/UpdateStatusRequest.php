<?php

namespace App\Http\Requests\Driver\OrderStatus;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', 'in:reached_restaurant,picked_up,delivered'],
            // Handover OTPs: picked_up is checked against orders.pick_up_code
            // (read from the restaurant), delivered against orders.delivery_code
            // (read from the customer). Not needed for reached_restaurant.
            'otp' => ['required_if:status,picked_up,delivered', 'string'],
        ];
    }

    public function status(): string
    {
        return (string) $this->input('status');
    }

    public function otp(): ?string
    {
        return $this->input('otp') !== null ? (string) $this->input('otp') : null;
    }
}
