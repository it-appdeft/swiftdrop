<?php

namespace App\Services\Customer;

use App\Contracts\Customer\CustomerRestaurantServiceInterface;
use App\DTO\Customer\CustomerRestaurantData;
use App\Models\MenuItem;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Support\Collection;

class CustomerRestaurantService implements CustomerRestaurantServiceInterface
{
    public function show(User $user, int $restaurantId, string $keyword = ''): CustomerRestaurantData
    {
        // Customers may only open live, approved restaurants — anything else 404s.
        $restaurant = Restaurant::query()
            ->active()
            ->approved()
            ->findOrFail($restaurantId);

        // Top list: the partner's full available menu in their configured order.
        $menuItems = MenuItem::query()
            ->forRestaurant($restaurant->id)
            ->available()
            ->with(['foodItem', 'modifierGroups.options'])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        // Recommended list: the same menu narrowed to what the customer searched
        // for (e.g. "pizza"). Empty keyword → nothing recommended.
        $keyword = trim($keyword);
        $recommended = $keyword === ''
            ? new Collection()
            : MenuItem::query()
                ->forRestaurant($restaurant->id)
                ->available()
                ->matchingKeyword($keyword)
                ->with('foodItem')
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get();

        return new CustomerRestaurantData(
            restaurant: $restaurant,
            menuItems: $menuItems,
            recommended: $recommended,
            keyword: $keyword,
        );
    }
}
