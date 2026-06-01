<?php

namespace App\Contracts\Customer;

use App\DTO\Customer\CustomerCartData;
use App\Models\User;

/**
 * Customer cart use-cases, shared verbatim by the web (Inertia) and API
 * controllers. Every mutation returns the rebuilt {@see CustomerCartData} so
 * the caller can immediately re-render the cart without a second round-trip.
 */
interface CustomerCartServiceInterface
{
    /** The customer's current cart with items + selected modifiers loaded. */
    public function getCart(User $user): CustomerCartData;

    /**
     * Add a menu item with its chosen add-ons. Identical lines (same dish +
     * same exact set of options) merge by bumping the quantity. Adding from a
     * different restaurant than the one already in the cart is rejected.
     *
     * @param  array<int, int>  $optionIds  Selected modifier_option ids.
     */
    public function addItem(User $user, int $menuItemId, int $quantity, array $optionIds): CustomerCartData;

    /** Set a line's quantity; quantity <= 0 removes the line. */
    public function updateItemQuantity(User $user, int $cartItemId, int $quantity): CustomerCartData;

    /**
     * Re-customise an existing line: replace its option set + quantity and
     * re-freeze the unit price. quantity <= 0 removes the line; if the new
     * option set matches another line for the same dish, the two are merged.
     *
     * @param  array<int, int>  $optionIds  Selected modifier_option ids.
     */
    public function updateItemSelection(User $user, int $cartItemId, int $quantity, array $optionIds): CustomerCartData;

    /** Remove a single line from the cart. */
    public function removeItem(User $user, int $cartItemId): CustomerCartData;

    /** Empty the cart entirely. */
    public function clear(User $user): CustomerCartData;
}
