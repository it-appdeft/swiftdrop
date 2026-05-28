<?php

namespace App\DTO\Customer;

use App\Models\CustomerAddress;
use Illuminate\Support\Collection;

class CustomerSearchResults
{
    /**
     * @param  Collection<int, array{restaurant: \App\Models\Restaurant, distance_miles: ?float}>  $restaurants
     * @param  Collection<int, array{restaurant: \App\Models\Restaurant, distance_miles: ?float, dishes: Collection<int, \App\Models\MenuItem>}>  $dishesByRestaurant
     * @param  Collection<int, \App\Models\CustomerSearchHistory>  $recent
     */
    /**
     * @param  array<string, mixed>  $restaurantsMeta  Pagination meta (incl. links) for the restaurants tab.
     * @param  array{offers: bool, highest_rated: bool}  $filters  Active post-keyword result filters.
     */
    public function __construct(
        public readonly string $keyword,
        public readonly Collection $restaurants,
        public readonly Collection $dishesByRestaurant,
        public readonly Collection $recent,
        public readonly ?CustomerAddress $address,
        public readonly float $radiusMiles,
        public readonly bool $usingFallback,
        public readonly array $restaurantsMeta = [],
        public readonly array $filters = ['offers' => false, 'highest_rated' => false],
    ) {
    }
}
