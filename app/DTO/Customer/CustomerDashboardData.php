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
     * @param  Collection<int, array{restaurant: \App\Models\Restaurant, distance_miles: ?float, is_favorited: bool}>  $restaurants
     */
    public function __construct(
        public readonly Collection $foodItems,
        public readonly Collection $restaurants,
        public readonly ?CustomerAddress $address,
        public readonly float $radiusMiles,
        public readonly bool $usingFallback,
        public readonly int $restaurantsTotal = 0,
        public readonly int $restaurantsPerPage = 10,
        public readonly int $restaurantsLastPage = 1,
        public readonly int $restaurantsCurrentPage = 1,
        public readonly int $foodItemsTotal = 0,
        public readonly int $foodItemsPerPage = 10,
        public readonly int $foodItemsLastPage = 1,
        public readonly int $foodItemsCurrentPage = 1,
        public readonly ?FoodItem $selectedFoodItem = null,
    ) {
    }
}
