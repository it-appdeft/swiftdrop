<?php

namespace App\Services\Customer;

use App\Contracts\Customer\CustomerFavoriteServiceInterface;
use App\Contracts\Customer\CustomerRestaurantServiceInterface;
use App\DTO\Customer\CustomerRestaurantData;
use App\Models\MenuItem;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Support\Collection;

class CustomerRestaurantService implements CustomerRestaurantServiceInterface
{
    /** Default page size for the restaurant detail menu list. */
    public const MENU_PER_PAGE = 10;

    public function __construct(
        protected CustomerFavoriteServiceInterface $favorites,
    ) {
    }

    public function show(
        User $user,
        int $restaurantId,
        string $keyword = '',
        int $menuPage = 1,
        int $menuPerPage = self::MENU_PER_PAGE,
    ): CustomerRestaurantData {
        // Customers may only open live, approved restaurants — anything else 404s.
        $restaurant = Restaurant::query()
            ->active()
            ->approved()
            ->with('hours')
            ->findOrFail($restaurantId);

        // Paginated menu — same partner sort order, 10 rows per page by default.
        $menuPaginator = MenuItem::query()
            ->forRestaurant($restaurant->id)
            ->available()
            ->with(['foodItem', 'modifierGroups.options'])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->paginate(perPage: $menuPerPage, page: $menuPage);

        // Recommended list: the same menu narrowed to what the customer searched
        // for (e.g. "pizza"). Empty keyword → nothing recommended. Not paginated
        // — usually a short, derived list that's rendered alongside the menu.
        $keyword = trim($keyword);
        $recommended = $keyword === ''
            ? new Collection()
            : MenuItem::query()
                ->forRestaurant($restaurant->id)
                ->available()
                ->matchingKeyword($keyword)
                ->with(['foodItem', 'modifierGroups.options'])
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get();

        $favoriteRestaurantIds = $this->favorites->favoriteRestaurantIds($user);
        $favoriteMenuItemIds = $this->favorites->favoriteMenuItemIds($user);

        return new CustomerRestaurantData(
            restaurant: $restaurant,
            menuItems: $menuPaginator->getCollection(),
            recommended: $recommended,
            keyword: $keyword,
            isFavorite: in_array($restaurant->id, $favoriteRestaurantIds, true),
            favoriteMenuItemIds: $favoriteMenuItemIds,
            menuCurrentPage: $menuPaginator->currentPage(),
            menuLastPage: $menuPaginator->lastPage(),
            menuPerPage: $menuPaginator->perPage(),
            menuTotal: $menuPaginator->total(),
        );
    }
}
