<?php

namespace App\Http\Requests\Customer\Checkout;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates an order-placement submission. Address ownership, delivery-range
 * and coupon rules are enforced in {@see \App\Services\Customer\CheckoutService},
 * which re-prices everything server-side.
 */
class PlaceOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'address_id' => ['required', 'integer'],
            'coupon_code' => ['nullable', 'string', 'max:40'],
            'special_instructions' => ['nullable', 'string', 'max:300'],
        ];
    }

    public function addressId(): int
    {
        return (int) $this->input('address_id');
    }

    public function couponCode(): ?string
    {
        $code = trim((string) $this->input('coupon_code', ''));

        return $code === '' ? null : $code;
    }

    public function specialInstructions(): ?string
    {
        $value = trim((string) $this->input('special_instructions', ''));

        return $value === '' ? null : $value;
    }
}
