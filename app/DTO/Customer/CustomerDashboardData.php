<?php

namespace App\DTO\Customer;

use App\Models\CustomerAddress;
use App\Models\FoodItem;
use Illuminate\Support\Collection;

/**
 * Plain data carrier from the dashboard service to the web / api response
 * layers. Keeping it framework-free means both controllers serialise it
 * in their own way (Inertia props vs JSON resource collections).
 */
class CustomerDashboardData
{
    /**
     * @param  Collection<int, FoodItem>  $foodItems
     * @param  Collection<int, array{restaurant: \App\Models\Restaurant, distance_miles: ?float}>  $restaurants
     */
    public function __construct(
        public readonly Collection $foodItems,
        public readonly Collection $restaurants,
        public readonly ?CustomerAddress $address,
        public readonly float $radiusMiles,
        public readonly bool $usingFallback,
    ) {
    }
}
