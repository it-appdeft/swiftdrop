<?php

namespace App\Contracts\Restaurant;

use App\Models\Order;
use App\Models\Restaurant;

/**
 * Restaurant-side order actions on the live queue. Both throw
 * {@see \App\Exceptions\ResourceNotFoundException} when the uuid isn't one
 * of this restaurant's orders, and {@see \App\Exceptions\InvalidInputException}
 * once the order has already moved past `placed` (accepted/rejected by
 * someone else, or cancelled by the customer).
 */
interface RestaurantOrderServiceInterface
{
    /** Accept a newly-placed order into the kitchen. */
    public function accept(Restaurant $restaurant, string $uuid): Order;

    /** Reject a newly-placed order — the customer sees it as cancelled. */
    public function reject(Restaurant $restaurant, string $uuid, ?string $reason = null): Order;

    /**
     * The kitchen side of the status progression — `status` is 'preparing'
     * or 'ready_for_pickup'.
     */
    public function updateStatus(Restaurant $restaurant, string $uuid, string $status): Order;
}
