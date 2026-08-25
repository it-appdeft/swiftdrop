<?php

namespace App\Services\Customer;

use App\Contracts\Customer\CustomerCartServiceInterface;
use App\DTO\Customer\CustomerCartData;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\MenuItem;
use App\Models\ModifierOption;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CustomerCartService implements CustomerCartServiceInterface
{
    /** Hard cap on a single line's quantity — keeps totals + UI sane. */
    private const MAX_QUANTITY = 99;

    public function getCart(User $user): CustomerCartData
    {
        return new CustomerCartData($this->loadCart($user));
    }

    public function addItem(User $user, int $menuItemId, int $quantity, array $optionIds): CustomerCartData
    {
        // Only live, switched-on dishes can be added.
        $menuItem = MenuItem::query()
            ->available()
            ->with(['modifierGroups.options', 'modifierOptions', 'restaurant.hours'])
            ->findOrFail($menuItemId);

        // …and only while the restaurant is actually orderable: a paused/closed
        // restaurant can't take new items even if a cart against it survives.
        $this->assertRestaurantOrderable($menuItem->restaurant);

        $quantity = max(1, $quantity);

        // Resolve the submitted option ids against the dish's own groups. The
        // AddCartItemRequest already enforced selection rules; here we just
        // build the priced snapshot and ignore anything not on this dish.
        $selected = $this->resolveSelections($menuItem, $optionIds);
        $unitPrice = $this->computeUnitPrice($menuItem, $optionIds);
        $signature = $this->signature($optionIds);

        return DB::transaction(function () use ($user, $menuItem, $quantity, $selected, $unitPrice, $signature) {
            $cart = Cart::firstOrCreate(['user_id' => $user->id]);

            // A cart holds one restaurant at a time. Block mixing once it has
            // contents; an empty cart simply adopts the new restaurant.
            if ($cart->restaurant_id && $cart->restaurant_id !== $menuItem->restaurant_id && $cart->items()->exists()) {
                throw ValidationException::withMessages([
                    'menu_item_id' => 'Your cart already has items from another restaurant. Clear it before adding this dish.',
                ]);
            }

            if ($cart->restaurant_id !== $menuItem->restaurant_id) {
                $cart->update(['restaurant_id' => $menuItem->restaurant_id]);
            }

            // Merge into an identical existing line (same dish + same exact
            // options) instead of creating a duplicate row.
            $existing = $cart->items()
                ->where('menu_item_id', $menuItem->id)
                ->with('modifiers')
                ->get()
                ->first(fn (CartItem $item) => $this->lineSignature($item) === $signature);

            if ($existing) {
                $existing->update([
                    'quantity' => min(self::MAX_QUANTITY, $existing->quantity + $quantity),
                    'unit_price' => $unitPrice,
                ]);

                return $this->getCart($user);
            }

            $line = $cart->items()->create([
                'menu_item_id' => $menuItem->id,
                'quantity' => min(self::MAX_QUANTITY, $quantity),
                'unit_price' => $unitPrice,
            ]);

            if ($selected->isNotEmpty()) {
                $line->modifiers()->createMany($selected->all());
            }

            return $this->getCart($user);
        });
    }

    public function updateItemQuantity(User $user, int $cartItemId, int $quantity): CustomerCartData
    {
        $item = $this->ownedItem($user, $cartItemId);

        if ($quantity <= 0) {
            return $this->removeItem($user, $cartItemId);
        }

        // Raising the quantity is "adding" — block it on a closed/paused
        // restaurant. Lowering or removing always stays allowed so the customer
        // can clear a cart left over from when it was open.
        if ($quantity > $item->quantity) {
            $item->loadMissing('cart.restaurant.hours');
            $this->assertRestaurantOrderable($item->cart?->restaurant);
        }

        $item->update(['quantity' => min(self::MAX_QUANTITY, $quantity)]);

        return $this->getCart($user);
    }

    public function updateItemSelection(User $user, int $cartItemId, int $quantity, array $optionIds): CustomerCartData
    {
        $item = $this->ownedItem($user, $cartItemId);

        // Editing the quantity down to zero is a removal, same as a plain
        // quantity update — no point reshuffling options on the way out.
        if ($quantity <= 0) {
            return $this->removeItem($user, $cartItemId);
        }

        $menuItem = MenuItem::query()
            ->available()
            ->with(['modifierGroups.options', 'restaurant.hours'])
            ->findOrFail($item->menu_item_id);

        // Re-customising an existing line is an order-building action, so it's
        // blocked on a closed/paused restaurant too (only removal is left).
        $this->assertRestaurantOrderable($menuItem->restaurant);

        // Rebuild the priced snapshot for the new selection (request already
        // validated the options belong to this dish + satisfy its groups).
        $selected = $this->resolveSelections($menuItem, $optionIds);
        $unitPrice = round((float) $menuItem->price + $selected->sum('price_delta'), 2);
        $signature = $this->signature($optionIds);
        $quantity = min(self::MAX_QUANTITY, $quantity);

        return DB::transaction(function () use ($user, $item, $menuItem, $quantity, $selected, $unitPrice, $signature) {
            $cart = $item->cart;

            // If another line already carries this exact option set, fold the
            // edited line into it (mirrors addItem's merge) rather than leaving
            // two identical combos in the cart.
            $duplicate = $cart->items()
                ->where('menu_item_id', $menuItem->id)
                ->whereKeyNot($item->id)
                ->with('modifiers')
                ->get()
                ->first(fn (CartItem $other) => $this->lineSignature($other) === $signature);

            if ($duplicate) {
                $duplicate->update([
                    'quantity' => min(self::MAX_QUANTITY, $duplicate->quantity + $quantity),
                    'unit_price' => $unitPrice,
                ]);
                $item->delete(); // its modifiers cascade away.

                return $this->getCart($user);
            }

            $item->update(['quantity' => $quantity, 'unit_price' => $unitPrice]);

            // Replace the frozen modifier snapshot with the new selection.
            $item->modifiers()->delete();
            if ($selected->isNotEmpty()) {
                $item->modifiers()->createMany($selected->all());
            }

            return $this->getCart($user);
        });
    }

    public function removeItem(User $user, int $cartItemId): CustomerCartData
    {
        $item = $this->ownedItem($user, $cartItemId);
        $cart = $item->cart;

        $item->delete(); // cart_item_modifiers cascade on delete.

        // An emptied cart releases its restaurant lock so the customer can
        // start fresh somewhere else.
        if ($cart && ! $cart->items()->exists()) {
            $cart->update(['restaurant_id' => null, 'coupon_code' => null, 'special_instructions' => null]);
        }

        return $this->getCart($user);
    }

    public function clear(User $user): CustomerCartData
    {
        $cart = $user->cart;

        if ($cart) {
            $cart->items()->delete();
            $cart->update(['restaurant_id' => null, 'coupon_code' => null, 'special_instructions' => null]);
        }

        return $this->getCart($user);
    }

    // ── Internals ────────────────────────────────────────────────────────────

    /**
     * Guard the order-building paths: a dish can only be added / increased /
     * re-customised while its restaurant is live, accepting orders and inside
     * its operating hours. Mirrors the checkout placement guard so a cart left
     * over from when the restaurant was open can't grow.
     */
    private function assertRestaurantOrderable(?Restaurant $restaurant): void
    {
        if (! $restaurant instanceof Restaurant || ! $restaurant->isBookable()) {
            throw ValidationException::withMessages([
                'menu_item_id' => 'This restaurant is not accepting orders right now.',
            ]);
        }
        if (! $restaurant->isOpenNow()) {
            throw ValidationException::withMessages([
                'menu_item_id' => 'This restaurant is currently closed.',
            ]);
        }
    }

    private function loadCart(User $user): ?Cart
    {
        return Cart::query()
            ->where('user_id', $user->id)
            ->with([
                'restaurant',
                'restaurant.uploads',
                'restaurant.hours',
                'items' => fn ($q) => $q->orderBy('id'),
                'items.menuItem.foodType',
                // The dish's customisation groups + per-dish option prices, so the
                // cart/checkout "+" can re-open the modifier dialog like the menu.
                'items.menuItem.modifierGroups.options',
                'items.menuItem.modifierOptions',
                'items.modifiers' => fn ($q) => $q->orderBy('id'),
            ])
            ->first();
    }

    /** Fetch a cart line, asserting it belongs to this customer. */
    private function ownedItem(User $user, int $cartItemId): CartItem
    {
        return CartItem::query()
            ->whereHas('cart', fn ($q) => $q->where('user_id', $user->id))
            ->findOrFail($cartItemId);
    }

    /**
     * Map submitted option ids to priced snapshot rows, pulling name + price
     * straight off the dish's loaded groups so the cart freezes them.
     *
     * @return Collection<int, array<string, mixed>>
     */
    private function resolveSelections(MenuItem $menuItem, array $optionIds): Collection
    {
        $ids = array_map('intval', $optionIds);
        $itemOptionPrices = $this->itemOptionPrices($menuItem);

        return $menuItem->modifierGroups
            ->flatMap(fn ($group) => $group->options
                ->whereIn('id', $ids)
                ->map(fn (ModifierOption $opt) => [
                    'modifier_group_id' => $group->id,
                    'modifier_option_id' => $opt->id,
                    'group_name' => $group->name,
                    'option_name' => $opt->name,
                    // Price-driver options snapshot their per-dish price; surcharge
                    // options snapshot their group delta.
                    'price_delta' => $group->is_price_driver
                        ? ($itemOptionPrices[$opt->id] ?? (float) $opt->price_delta)
                        : (float) $opt->price_delta,
                ]))
            ->values();
    }

    /**
     * Unit price for a dish + selected options.
     *
     * A price-driver group (e.g. Pizza size) sets the ABSOLUTE base price —
     * the picked size's price replaces the dish's base price rather than
     * adding to it. Every other (surcharge) group adds its options' deltas
     * on top. Keyed off the is_price_driver flag, never the group name.
     */
    private function computeUnitPrice(MenuItem $menuItem, array $optionIds): float
    {
        $ids = array_map('intval', $optionIds);
        $base = (float) $menuItem->price;
        $surcharge = 0.0;
        $itemOptionPrices = $this->itemOptionPrices($menuItem);

        foreach ($menuItem->modifierGroups as $group) {
            $picked = $group->options->whereIn('id', $ids);
            if ($picked->isEmpty()) {
                continue;
            }

            if ($group->is_price_driver) {
                // Pick-one group, so the first picked option is the size. Its
                // price is the per-dish price (falls back to the group delta).
                $opt = $picked->first();
                $base = $itemOptionPrices[$opt->id] ?? (float) $opt->price_delta;
            } else {
                $surcharge += (float) $picked->sum('price_delta');
            }
        }

        return round($base + $surcharge, 2);
    }

    /** Per-dish price for each price-driver option: option id → price. */
    private function itemOptionPrices(MenuItem $menuItem): array
    {
        if (! $menuItem->relationLoaded('modifierOptions')) {
            return [];
        }

        return $menuItem->modifierOptions
            ->mapWithKeys(fn (ModifierOption $o) => [(int) $o->id => (float) $o->pivot->price])
            ->all();
    }

    /** Order-independent fingerprint of a selection set, for line merging. */
    private function signature(array $optionIds): string
    {
        $ids = array_values(array_unique(array_map('intval', $optionIds)));
        sort($ids);

        return implode(',', $ids);
    }

    private function lineSignature(CartItem $item): string
    {
        return $this->signature(
            $item->modifiers->pluck('modifier_option_id')->filter()->all(),
        );
    }
}
