<?php

namespace App\Http\Resources\Customer\Concerns;

use App\Models\MenuItem;
use App\Models\ModifierGroup;

/**
 * Shapes a dish's customisation groups for the customer payloads. Shared by the
 * restaurant-detail and cart/checkout resources so a dish customises the same
 * way wherever it's shown — the menu, the cart row, the checkout summary.
 */
trait ShapesDishModifiers
{
    /**
     * The dish's modifier groups, or [] when the relation isn't loaded. Centralises
     * the relationLoaded guard both payloads need.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function dishModifierGroups(MenuItem $item): array
    {
        return $item->relationLoaded('modifierGroups')
            ? $item->modifierGroups->map(fn (ModifierGroup $group) => $this->modifierGroup($group, $item))->values()->all()
            : [];
    }

    /**
     * One customisation group (Size, Toppings-Veg, Cheese & Dip…) with its
     * selectable options. selection_type drives radios vs. checkboxes; the
     * required + min/max fields let the frontend gate the "Add Item" button.
     *
     * @return array<string, mixed>
     */
    protected function modifierGroup(ModifierGroup $group, MenuItem $item): array
    {
        // Per-dish prices for price-driver options: option id → price. A
        // price-driver group only shows the options this dish offers (those
        // with a per-dish price row), priced from that row.
        $itemPrices = $item->relationLoaded('modifierOptions')
            ? $item->modifierOptions->mapWithKeys(fn ($o) => [(int) $o->id => (float) $o->pivot->price])
            : collect();

        $options = $group->options;
        if ($group->is_price_driver) {
            $options = $options->filter(fn ($o) => $itemPrices->has((int) $o->id));
        }

        return [
            'id' => $group->id,
            'name' => $group->name,
            'description' => $group->description,
            'selection_type' => $group->selection_type, // 'single' | 'multiple'
            'is_price_driver' => (bool) $group->is_price_driver,
            'is_required' => (bool) $group->is_required,
            'min_selections' => (int) $group->min_selections,
            'max_selections' => $group->max_selections !== null ? (int) $group->max_selections : null,
            'options' => $options->map(fn ($option) => [
                'id' => $option->id,
                'name' => $option->name,
                'price_delta' => $group->is_price_driver
                    ? (float) ($itemPrices[(int) $option->id] ?? 0)
                    : (float) $option->price_delta,
                'is_default' => (bool) $option->is_default,
            ])->values()->all(),
        ];
    }
}
