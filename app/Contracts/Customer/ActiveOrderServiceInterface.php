<?php

namespace App\Contracts\Customer;

use App\Models\User;

/**
 * Backs the persistent "active order" bar shown across the customer web app
 * (and available to the mobile app over the same endpoint) — every order the
 * customer has in flight, with a live ETA once the restaurant has accepted it.
 */
interface ActiveOrderServiceInterface
{
    /**
     * All of the customer's active orders (placed → out_for_delivery),
     * newest first. `eta_minutes` stays null until the restaurant accepts —
     * see RestaurantOrderService::accept(), the only place that stamps it.
     *
     * @return array<int, array<string, mixed>>
     */
    public function active(User $user): array;
}
