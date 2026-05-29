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
    public function __construct(
        public readonly string $keyword,
        public readonly Collection $restaurants,
        public readonly Collection $dishesByRestaurant,
        public readonly Collection $recent,
        public readonly ?CustomerAddress $address,
        public readonly float $radiusMiles,
        public readonly bool $usingFallback,
        public readonly int $restaurantsCurrentPage = 1,
        public readonly int $restaurantsLastPage = 1,
        public readonly int $restaurantsPerPage = 10,
        public readonly int $restaurantsTotal = 0,
    ) {
    }
}
