<?php

namespace App\Contracts\Customer;

use App\DTO\Customer\CheckoutData;
use App\Models\Order;
use App\Models\User;

/**
 * Checkout use-cases shared by the web (Inertia) and API controllers: build
 * the priced summary for a chosen address + optional coupon, and place the
 * order. Both recompute everything server-side so the client can never fix the
 * price or bypass the delivery-range gate.
 */
interface CheckoutServiceInterface
{
    /**
     * Build the full checkout payload for the customer's current cart against
     * the given address (defaults to their selected address) and an optional
     * coupon code. Out-of-range and invalid-coupon states are returned in the
     * payload, not thrown, so the page can render them inline.
     */
    public function summary(User $user, ?int $addressId = null, ?string $couponCode = null): CheckoutData;

    /**
     * Place the order: re-validate range + coupon, snapshot items + modifiers,
     * record coupon usage, empty the cart. Throws ValidationException on an
     * out-of-range address or invalid coupon.
     */
    public function place(User $user, int $addressId, ?string $couponCode, ?string $specialInstructions): Order;
}
