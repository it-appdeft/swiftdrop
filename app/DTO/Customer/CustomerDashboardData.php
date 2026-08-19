<?php

namespace App\DTO\Customer;

use App\Models\CustomerAddress;
use App\Models\Banner;
use App\Models\FoodType;
use Illuminate\Support\Collection;

/**
 * Plain data carrier from the dashboard service to the web / api response
 * layers. Keeping it framework-free means both controllers serialise it
 * in their own way (Inertia props vs JSON resource collections).
 */
class CustomerDashboardData
{
    /**
     * @param  Collection<int, FoodType>  $foodTypes   First 20, no location check.
    * @param  Collection<int, Banner>  $banners   Active customer-facing banners.
     * @param  Collection<int, array{restaurant: \App\Models\Restaurant, distance_miles: ?float, is_favorited: bool}>  $topPicks     5 bookable + near + high-rated.
     * @param  Collection<int, array{restaurant: \App\Models\Restaurant, distance_miles: ?float, is_favorited: bool}>  $restaurants  Paginated page.
     * @param  array<string, mixed>  $restaurantsMeta  Pagination meta (incl. links) for the restaurants list.
     */
    public function __construct(
        public readonly Collection $foodTypes,
        public readonly Collection $banners,
        public readonly Collection $topPicks,
        public readonly Collection $restaurants,
        public readonly ?CustomerAddress $address,
        public readonly float $radiusMiles,
        public readonly bool $usingFallback,
        public readonly array $restaurantsMeta = [],
        public readonly ?FoodType $selectedFoodType = null,
    ) {
    }
}
