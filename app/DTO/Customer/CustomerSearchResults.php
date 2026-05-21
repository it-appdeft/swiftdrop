<?php

namespace App\DTO\Customer;

use App\Models\CustomerAddress;
use Illuminate\Support\Collection;

class CustomerSearchResults
{
    /**
     * @param  Collection<int, array{restaurant: \App\Models\Restaurant, distance_miles: ?float}>  $restaurants
     * @param  Collection<int, array{menu_item: \App\Models\MenuItem, restaurant: \App\Models\Restaurant, distance_miles: ?float}>  $menuItems
     * @param  Collection<int, \App\Models\CustomerSearchHistory>  $recent
     */
    public function __construct(
        public readonly string $keyword,
        public readonly Collection $restaurants,
        public readonly Collection $menuItems,
        public readonly Collection $recent,
        public readonly ?CustomerAddress $address,
        public readonly float $radiusMiles,
        public readonly bool $usingFallback,
    ) {
    }
}
