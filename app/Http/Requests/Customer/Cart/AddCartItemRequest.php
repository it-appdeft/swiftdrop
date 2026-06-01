<?php

namespace App\Http\Requests\Customer\Cart;

use App\Http\Requests\Customer\Cart\Concerns\ValidatesModifierSelections;
use App\Models\MenuItem;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates an "add to cart" submission for BOTH the web and API controllers.
 * Structural rules live in {@see rules()}; the per-dish modifier rules
 * (required groups, single vs. multiple, min/max selections, options that
 * actually belong to the dish) run in {@see withValidator()} against the
 * item's own groups so the same guarantees hold on every transport.
 */
class AddCartItemRequest extends FormRequest
{
    use ValidatesModifierSelections;

    private ?MenuItem $menuItem = null;

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'menu_item_id' => ['required', 'integer', 'exists:menu_items,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:99'],
            'options' => ['present', 'array'],
            'options.*' => ['integer', 'distinct', 'exists:modifier_options,id'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $item = $this->menuItem();
            if (! $item) {
                return; // exists:menu_items already flagged it.
            }

            if (! $item->is_available) {
                $validator->errors()->add('menu_item_id', 'This item is currently unavailable.');

                return;
            }

            $this->validateModifierSelections($validator, $item, $this->optionIds());
        });
    }

    /** Loaded once, with the dish's groups + options, for the rules above. */
    public function menuItem(): ?MenuItem
    {
        if ($this->menuItem === null) {
            $this->menuItem = MenuItem::query()
                ->with('modifierGroups.options')
                ->find($this->input('menu_item_id'));
        }

        return $this->menuItem;
    }

    public function menuItemId(): int
    {
        return (int) $this->input('menu_item_id');
    }

    public function quantity(): int
    {
        return (int) $this->input('quantity', 1);
    }

    /** @return array<int, int> */
    public function optionIds(): array
    {
        return array_values(array_map('intval', (array) $this->input('options', [])));
    }
}
