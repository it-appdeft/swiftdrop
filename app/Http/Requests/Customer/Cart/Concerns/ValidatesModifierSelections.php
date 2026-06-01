<?php

namespace App\Http\Requests\Customer\Cart\Concerns;

use App\Models\MenuItem;
use App\Models\ModifierGroup;
use Illuminate\Contracts\Validation\Validator;

/**
 * Per-dish modifier rules shared by the "add to cart" and "edit cart line"
 * requests: options must belong to the dish, single-select groups take at most
 * one (and exactly one when required), multi-select groups respect their
 * required + min/max bounds. Keeping it in one place means the same guarantees
 * hold whether a line is first added or later re-customised.
 */
trait ValidatesModifierSelections
{
    /**
     * @param  array<int, int>  $selected  Submitted modifier_option ids.
     */
    protected function validateModifierSelections(
        Validator $validator,
        MenuItem $item,
        array $selected,
        string $errorKey = 'options',
    ): void {
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
                $validator->errors()->add($errorKey, 'One or more selected options are not available for this item.');

                return;
            }
        }

        // Per-group rules.
        foreach ($item->modifierGroups as $group) {
            $count = collect($selected)
                ->filter(fn ($id) => ($optionToGroup[$id] ?? null)?->id === $group->id)
                ->count();

            $this->validateModifierGroup($validator, $group, $count, $errorKey);
        }
    }

    private function validateModifierGroup(
        Validator $validator,
        ModifierGroup $group,
        int $count,
        string $errorKey,
    ): void {
        if ($group->selection_type === ModifierGroup::SELECTION_SINGLE) {
            if ($count > 1) {
                $validator->errors()->add($errorKey, "Please choose only one option for \"{$group->name}\".");
            }
            if ($group->is_required && $count < 1) {
                $validator->errors()->add($errorKey, "Please choose an option for \"{$group->name}\".");
            }

            return;
        }

        // Multiple-selection group.
        $min = max($group->is_required ? 1 : 0, (int) $group->min_selections);
        if ($count < $min) {
            $validator->errors()->add($errorKey, "Please choose at least {$min} option(s) for \"{$group->name}\".");
        }
        if ($group->max_selections !== null && $count > $group->max_selections) {
            $validator->errors()->add($errorKey, "Please choose at most {$group->max_selections} option(s) for \"{$group->name}\".");
        }
    }
}
