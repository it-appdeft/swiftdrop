<?php

namespace App\Http\Requests\Customer\Cart;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Quantity change for an existing cart line. Ownership of the line is asserted
 * in the service, not here. Quantity 0 is allowed and means "remove".
 */
class UpdateCartItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'quantity' => ['required', 'integer', 'min:0', 'max:99'],
        ];
    }

    public function quantity(): int
    {
        return (int) $this->input('quantity');
    }
}
