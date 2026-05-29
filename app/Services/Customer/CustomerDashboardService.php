<?php

namespace App\Services\Customer;

use App\Contracts\Customer\CustomerDashboardServiceInterface;
use App\Contracts\Customer\CustomerFavoriteServiceInterface;
use App\DTO\Customer\CustomerDashboardData;
use App\Models\CustomerAddress;
use App\Models\FoodItem;
use App\Models\Restaurant;
use App\Models\User;
use App\Services\Platform\PlatformConfigService;
use App\Support\PaginationMeta;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class CustomerDashboardService implements CustomerDashboardServiceInterface
{
    /** Default page size for the customer-facing restaurants list (home + index). */
    public const RESTAURANTS_PER_PAGE = 10;

    /** Default page size for the food-items "Explore" strip. */
    public const FOOD_ITEMS_PER_PAGE = 10;

    public function __construct(
        protected PlatformConfigService $config,
        protected CustomerFavoriteServiceInterface $favorites,
    ) {
    }

    public function build(
        ?User $user,
        int $restaurantsPage = 1,
        int $foodItemsPage = 1,
        ?int $foodItemId = null,
    ): CustomerDashboardData {
        $radius = $this->dashboardRadius();
        $address = $this->defaultAddressFor($user);
        $usingFallback = ! ($address && $address->lat !== null && $address->lng !== null);

        // Filtered list — what the customer actually sees (may be a subset
        // when a food-item filter is active). pageName drives the ?query key
        // baked into the pagination links so they round-trip correctly.
        $restaurantsPaginator = $this->paginateRestaurants(
            $user,
            page: $restaurantsPage,
            perPage: self::RESTAURANTS_PER_PAGE,
            foodItemId: $foodItemId,
            pageName: 'restaurants_page',
        );
        /** @var Collection<int, array{restaurant: Restaurant, distance_miles: ?float, is_favorited: bool}> $restaurants */
        $restaurants = collect($restaurantsPaginator->items());

        // food_items strip stays unfiltered by the active food-item selection,
        // so the customer can switch dishes. We compute the strip from the
        // FULL set of reachable restaurants (not just the filtered page).
        $reachableIds = $this->reachableRestaurantIds($user);
        $foodItemsPaginator = $this->paginateFoodItemsForRestaurants(
            $reachableIds,
            $foodItemsPage,
            self::FOOD_ITEMS_PER_PAGE,
            pageName: 'food_items_page',
        );

        // The food-item filter must survive across the restaurants links, and
        // the active food-item page must survive across the restaurants links
        // (and vice versa) — append the cross-list query params.
        $restaurantsPaginator->appends(array_filter([
            'food_item_id' => $foodItemId,
            'food_items_page' => $foodItemsPage > 1 ? $foodItemsPage : null,
        ]));
        $foodItemsPaginator->appends(array_filter([
            'food_item_id' => $foodItemId,
            'restaurants_page' => $restaurantsPage > 1 ? $restaurantsPage : null,
        ]));

        // Resolve the selected food item so the resource can echo its name +
        // image back to the frontend (used for the "showing restaurants
        // offering X" banner without an extra fetch).
        $selectedFoodItem = $foodItemId !== null ? FoodItem::query()->find($foodItemId) : null;

        return new CustomerDashboardData(
            foodItems: $foodItemsPaginator->getCollection(),
            restaurants: $restaurants,
            address: $address,
            radiusMiles: $radius,
            usingFallback: $usingFallback,
            restaurantsMeta: PaginationMeta::make($restaurantsPaginator),
            foodItemsMeta: PaginationMeta::make($foodItemsPaginator),
            selectedFoodItem: $selectedFoodItem,
        );
    }

    /**
     * IDs of every active/approved restaurant the customer can see — geo-bound
     * if they have a saved address with coords, otherwise the global active
     * list. Used to compute the food_items strip independently of any active
     * food-item filter.
     *
     * @return array<int, int>
     */
    protected function reachableRestaurantIds(?User $user): array
    {
        $address = $this->defaultAddressFor($user);
        $radius = $this->dashboardRadius();

        $query = Restaurant::query()->active()->approved();
        if ($address && $address->lat !== null && $address->lng !== null) {
            $query->withinRadius((float) $address->lat, (float) $address->lng, $radius);
        }

        return $query->pluck('restaurants.id')->all();
    }

    /**
     * Paginated food items the dashboard's currently-visible restaurants offer.
     * Empty `$restaurantIds` short-circuits to an empty paginator so we don't
     * issue a query that can never match anything.
     */
    protected function paginateFoodItemsForRestaurants(array $restaurantIds, int $page, int $perPage, string $pageName = 'page'): LengthAwarePaginator
    {
        if ($restaurantIds === []) {
            return new \Illuminate\Pagination\LengthAwarePaginator(
                items: [],
                total: 0,
                perPage: $perPage,
                currentPage: $page,
                options: ['pageName' => $pageName, 'path' => \Illuminate\Pagination\Paginator::resolveCurrentPath()],
            );
        }

        return FoodItem::query()
            ->availableForRestaurants($restaurantIds)
            ->orderBy('id')
            ->paginate(perPage: $perPage, pageName: $pageName, page: $page);
    }

    /**
     * Paginated restaurants for the customer surfaces (home + /customer/restaurants index).
     * Geo-aware: when the customer has a saved address with coords we use the
     * radius scope and sort by distance; otherwise we fall back to a global
     * "newest" list so the page is never empty.
     *
     * Each row carries `is_favorited` so the frontend can flip the heart icon
     * without a second roundtrip.
     */
    public function paginateRestaurants(
        ?User $user,
        int $page = 1,
        int $perPage = self::RESTAURANTS_PER_PAGE,
        ?int $foodItemId = null,
        string $pageName = 'page',
    ): LengthAwarePaginator {
        $address = $this->defaultAddressFor($user);
        $radius = $this->dashboardRadius();

        $hasGeo = $address && $address->lat !== null && $address->lng !== null;

        $query = Restaurant::query()->active()->approved();
        if ($hasGeo) {
            $query->withinRadius((float) $address->lat, (float) $address->lng, $radius)
                ->orderByDesc('rating')
                ->orderBy('distance_miles');
        } else {
            $query->orderByDesc('created_at');
        }

        // Optional dashboard filter: keep only restaurants that have at least
        // one available menu item tagged with the chosen food_item_id.
        if ($foodItemId !== null) {
            $query->whereHas('menuItems', fn ($q) => $q
                ->where('food_item_id', $foodItemId)
                ->where('is_available', true));
        }

        $paginator = $query->paginate(perPage: $perPage, pageName: $pageName, page: $page);

        $favoriteIds = $user ? array_flip($this->favorites->favoriteRestaurantIds($user)) : [];

        $paginator->setCollection($paginator->getCollection()
            ->map(fn (Restaurant $r) => [
                'restaurant' => $r,
                'distance_miles' => $r->distance_miles !== null
                    ? round((float) $r->distance_miles, 2)
                    : null,
                'is_favorited' => isset($favoriteIds[$r->id]),
            ])
            ->values());

        return $paginator;
    }

    protected function dashboardRadius(): float
    {
        return max(0.1, $this->config->float(
            PlatformConfigService::KEY_DASHBOARD_RADIUS_MILES,
            5.0,
        ));
    }

    protected function defaultAddressFor(?User $user): ?CustomerAddress
    {
        if (! $user) {
            return null;
        }

        $profile = $user->customerProfile;
        if (! $profile) {
            return null;
        }

        // Selected is the customer's explicit choice; fall back to default
        // and finally the most recent address so single-address customers
        // never see fallback results.
        return $profile->selectedAddress()->first()
            ?? $profile->defaultAddress()->first()
            ?? $profile->addresses()->latest('id')->first();
    }

}
