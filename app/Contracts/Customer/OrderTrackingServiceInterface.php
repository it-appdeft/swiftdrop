<?php

namespace App\Contracts\Customer;

use App\Models\User;

/**
 * Post-checkout order tracking shared by the web (Inertia) and API
 * controllers: a live status payload the tracking page polls every 5s, and
 * customer-initiated cancellation. Both return the same array shape so
 * either controller can hand it straight back as JSON.
 */
interface OrderTrackingServiceInterface
{
    /**
     * Build the tracking payload for one of the customer's own orders.
     * Throws {@see \App\Exceptions\ResourceNotFoundException} when the uuid
     * doesn't resolve to an order owned by this customer.
     *
     * @return array<string, mixed>
     */
    public function status(User $user, string $uuid): array;

    /**
     * Cancel an order the customer still can — i.e. it hasn't been accepted
     * yet. Throws {@see \App\Exceptions\InvalidInputException} otherwise.
     * Returns the refreshed status payload.
     *
     * @return array<string, mixed>
     */
    public function cancel(User $user, string $uuid, ?string $reason): array;
}
