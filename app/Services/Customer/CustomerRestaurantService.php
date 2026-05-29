<?php

namespace App\Services\Customer;

use App\Contracts\Customer\CustomerFavoriteServiceInterface;
use App\Contracts\Customer\CustomerRestaurantServiceInterface;
use App\DTO\Customer\CustomerRestaurantData;
use App\Models\MenuItem;
use App\Models\Restaurant;
use App\Models\User;
use App\Support\PaginationMeta;
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
        array $filters = [],
    ): CustomerRestaurantData {
        // Customers may only open live, approved restaurants — anything else 404s.
        $restaurant = Restaurant::query()
            ->active()
            ->approved()
            ->with(['hours', 'uploads'])
            ->findOrFail($restaurantId);

        // Normalise the customer-facing menu filters (Veg / Non-Veg + Ratings 4.0+).
        $filters = [
            'diet' => in_array($filters['diet'] ?? null, ['veg', 'non_veg'], true) ? $filters['diet'] : null,
            'min_rating' => isset($filters['min_rating']) && (float) $filters['min_rating'] > 0
                ? (float) $filters['min_rating']
                : null,
        ];

        // Paginated menu — same partner sort order, 10 rows per page by default,
        // narrowed by the diet/rating filters via the model scope.
        $menuPaginator = MenuItem::query()
            ->forRestaurant($restaurant->id)
            ->available()
            ->customerFilter($filters)
            ->with(['foodType', 'modifierGroups.options', 'modifierOptions'])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->paginate(perPage: $menuPerPage, page: $menuPage);

        // Recommended list: the same menu narrowed to what the customer searched
        // for (e.g. "pizza"). Empty keyword → nothing recommended. Not paginated
        // — usually a short, derived list that's rendered alongside the menu.
        // The same filters apply so it stays consistent with the main list.
        $keyword = trim($keyword);
        $recommended = $keyword === ''
            ? new Collection()
            : MenuItem::query()
                ->forRestaurant($restaurant->id)
                ->available()
                ->matchingKeyword($keyword)
                ->customerFilter($filters)
                ->with(['foodType', 'modifierGroups.options', 'modifierOptions'])
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get();

        $favoriteRestaurantIds = $this->favorites->favoriteRestaurantIds($user);
        $favoriteMenuItemIds = $this->favorites->favoriteMenuItemIds($user);

        // Keep the active keyword + filters on the menu pagination links so
        // paging within a filtered/searched view round-trips correctly.
        $menuPaginator->appends(array_filter([
            'search' => $keyword !== '' ? $keyword : null,
            'diet' => $filters['diet'],
            'min_rating' => $filters['min_rating'],
        ]));

        return new CustomerRestaurantData(
            restaurant: $restaurant,
            menuItems: $menuPaginator->getCollection(),
            recommended: $recommended,
            keyword: $keyword,
            isFavorite: in_array($restaurant->id, $favoriteRestaurantIds, true),
            favoriteMenuItemIds: $favoriteMenuItemIds,
            menuMeta: PaginationMeta::make($menuPaginator),
            filters: $filters,
        );
    }
}
