<?php

namespace App\Http\Requests\Customer\Cart;

use App\Http\Requests\Customer\Cart\Concerns\ValidatesModifierSelections;
use App\Models\CartItem;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Edit an existing cart line. Quantity is always required (0 means "remove").
 * `options` is optional — when present, the line is re-customised: the new set
 * is validated against the line's own dish exactly like an add, so the same
 * required / single / min-max rules hold. Ownership of the line is asserted in
 * the service, not here.
 */
class UpdateCartItemRequest extends FormRequest
{
    use ValidatesModifierSelections;

    private ?CartItem $cartItem = null;

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'quantity' => ['required', 'integer', 'min:0', 'max:99'],
            'options' => ['sometimes', 'array'],
            'options.*' => ['integer', 'distinct', 'exists:modifier_options,id'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        // Only re-validate options when the caller actually submitted them —
        // a plain quantity change leaves the line's customisation untouched.
        if (! $this->editsOptions()) {
            return;
        }

        $validator->after(function (Validator $validator) {
            $dish = $this->cartItem()?->menuItem;
            if (! $dish) {
                return; // ownership / existence handled in the service.
            }

            $this->validateModifierSelections($validator, $dish, $this->optionIds());
        });
    }

    /** True when the request carries an `options` array (a re-customisation). */
    public function editsOptions(): bool
    {
        return $this->has('options') && is_array($this->input('options'));
    }

    public function quantity(): int
    {
        return (int) $this->input('quantity');
    }

    /** @return array<int, int> */
    public function optionIds(): array
    {
        return array_values(array_map('intval', (array) $this->input('options', [])));
    }

    /** The line being edited, with its dish's groups + options for validation. */
    private function cartItem(): ?CartItem
    {
        if ($this->cartItem === null) {
            $this->cartItem = CartItem::query()
                ->with('menuItem.modifierGroups.options')
                ->find($this->route('itemId'));
        }

        return $this->cartItem;
    }
}
