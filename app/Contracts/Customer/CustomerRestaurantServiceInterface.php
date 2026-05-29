<?php

namespace App\Contracts\Customer;

use App\DTO\Customer\CustomerRestaurantData;
use App\Models\User;

interface CustomerRestaurantServiceInterface
{
    /**
     * Build the customer-facing restaurant detail payload: the restaurant
     * header, its full available menu in the partner's sort order, and a
     * "recommended" list filtered to the keyword the customer searched before
     * landing here (empty keyword → empty recommended list).
     */
    public function show(User $user, int $restaurantId, string $keyword = ''): CustomerRestaurantData;
}
