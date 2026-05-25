<?php

namespace App\Http\Requests\Customer\Cart;

use App\Models\MenuItem;
use App\Models\ModifierGroup;
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

            $selected = $this->optionIds();

            // Index every option this dish actually offers, by group.
            $optionToGroup = [];
            foreach ($item->modifierGroups as $group) {
                foreach ($group->options as $option) {
                    $optionToGroup[$option->id] = $group;
                }
            }

            // Reject options that don't belong to this dish.
            foreach ($selected as $optionId) {
                if (! isset($optionToGroup[$optionId])) {
                    $validator->errors()->add('options', 'One or more selected options are not available for this item.');

                    return;
                }
            }

            // Per-group rules.
            foreach ($item->modifierGroups as $group) {
                $count = collect($selected)
                    ->filter(fn ($id) => ($optionToGroup[$id] ?? null)?->id === $group->id)
                    ->count();

                $this->validateGroup($validator, $group, $count);
            }
        });
    }

    private function validateGroup(Validator $validator, ModifierGroup $group, int $count): void
    {
        if ($group->selection_type === ModifierGroup::SELECTION_SINGLE) {
            if ($count > 1) {
                $validator->errors()->add('options', "Please choose only one option for \"{$group->name}\".");
            }
            if ($group->is_required && $count < 1) {
                $validator->errors()->add('options', "Please choose an option for \"{$group->name}\".");
            }

            return;
        }

        // Multiple-selection group.
        $min = max($group->is_required ? 1 : 0, (int) $group->min_selections);
        if ($count < $min) {
            $validator->errors()->add('options', "Please choose at least {$min} option(s) for \"{$group->name}\".");
        }
        if ($group->max_selections !== null && $count > $group->max_selections) {
            $validator->errors()->add('options', "Please choose at most {$group->max_selections} option(s) for \"{$group->name}\".");
        }
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
