<?php

namespace App\DTO\Customer;

use App\Models\Restaurant;
use Illuminate\Support\Collection;

/**
 * Plain data carrier from {@see \App\Services\Customer\CustomerRestaurantService}
 * to the web / api response layers. Both controllers serialise it through the
 * shared {@see \App\Http\Resources\Customer\CustomerRestaurantResource}.
 */
class CustomerRestaurantData
{
    /**
     * @param  Collection<int, \App\Models\MenuItem>  $menuItems              Paginated slice of the menu, partner sort order.
     * @param  Collection<int, \App\Models\MenuItem>  $recommended            Menu items matching the search keyword.
     * @param  array<int, int>                         $favoriteMenuItemIds    menu_item ids the customer has favourited.
     */
    public function __construct(
        public readonly Restaurant $restaurant,
        public readonly Collection $menuItems,
        public readonly Collection $recommended,
        public readonly string $keyword,
        public readonly ?float $distanceMiles = null,
        public readonly bool $isFavorite = false,
        public readonly array $favoriteMenuItemIds = [],
        public readonly int $menuCurrentPage = 1,
        public readonly int $menuLastPage = 1,
        public readonly int $menuPerPage = 10,
        public readonly int $menuTotal = 0,
    ) {
    }
}
