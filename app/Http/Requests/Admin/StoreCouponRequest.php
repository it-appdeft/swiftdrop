<?php

namespace App\Http\Requests\Admin;

use App\Models\Offer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCouponRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('admin');
    }

    /**
     * Free-delivery coupons carry no discount value — the form hides the field,
     * so default it to 0 before validation rather than failing "required".
     */
    protected function prepareForValidation(): void
    {
        if ($this->input('type') === Offer::TYPE_FREE_DELIVERY) {
            $this->merge(['value' => $this->input('value') ?: 0]);
        }
    }

    public function rules(): array
    {
        return $this->couponRules();
    }

    /** Shared rule set; UpdateCouponRequest overrides the unique-code ignore. */
    protected function couponRules(?int $ignoreId = null): array
    {
        return [
            'code' => ['required', 'string', 'max:40', 'alpha_dash', Rule::unique('offers', 'code')->ignore($ignoreId)],
            'title' => ['nullable', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:255'],
            'type' => ['required', Rule::in(Offer::TYPES)],
            // Percentage is capped at 100; flat/free_delivery just need to be >= 0.
            'value' => ['required', 'numeric', 'min:0', $this->input('type') === Offer::TYPE_PERCENTAGE ? 'max:100' : 'max:100000'],
            'min_order_value' => ['nullable', 'numeric', 'min:0', 'max:100000'],
            'max_discount' => ['nullable', 'numeric', 'min:0', 'max:100000'],
            'trigger' => ['required', Rule::in(Offer::TRIGGERS)],
            'max_uses_per_user' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'valid_from' => ['nullable', 'date'],
            'valid_until' => ['nullable', 'date', 'after_or_equal:valid_from'],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
