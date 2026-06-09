<?php

namespace App\Services\Customer;

use App\Contracts\Customer\CustomerSearchServiceInterface;
use App\DTO\Customer\CustomerSearchResults;
use App\Models\CustomerAddress;
use App\Models\CustomerProfile;
use App\Models\CustomerSearchHistory;
use App\Models\MenuItem;
use App\Models\Restaurant;
use App\Models\User;
use App\Services\Platform\PlatformConfigService;
use App\Support\Location\LocationContext;
use App\Support\PaginationMeta;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator as LengthAwarePaginatorImpl;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class CustomerSearchService implements CustomerSearchServiceInterface
{
    protected const RECENT_LIMIT = 10;

    public const RESTAURANTS_PER_PAGE = 10;

    /** Max matching dishes nested under each restaurant on the Items tab. */
    public const ITEMS_PER_RESTAURANT = 3;

    /** Allowed search modes (the `{type}` route segment). */
    public const TYPE_RESTAURANT = 'restaurant';

    public const TYPE_ITEMS = 'items';

    public function __construct(
        protected PlatformConfigService $config,
    ) {
    }

    /**
     * Two search modes, selected by `$type`:
     *  - `restaurant`: restaurants matched by name OR by an offered food type
     *    (no dishes nested).
     *  - `items`: restaurants that have a keyword-matching dish, each with up
     *    to {@see ITEMS_PER_RESTAURANT} matching dishes nested. Restaurant-name
     *    matches do NOT qualify here — only dish matches.
     *
     * Both modes paginate restaurants identically (10/page) so the two tabs
     * share the restaurant API's pagination contract.
     */
    public function search(User $user, string $type, string $keyword, int $page = 1, int $perPage = self::RESTAURANTS_PER_PAGE, array $filters = [], ?LocationContext $location = null): CustomerSearchResults
    {
        $type = $type === self::TYPE_ITEMS ? self::TYPE_ITEMS : self::TYPE_RESTAURANT;
        $profile = $user->customerProfile;
        $keyword = trim($keyword);
        $filters = [
            'offers' => (bool) ($filters['offers'] ?? false),
            'highest_rated' => (bool) ($filters['highest_rated'] ?? false),
        ];

        // Web omits $location and discovery uses the customer's saved address;
        // the API passes an explicit context from the frontend latitude/
        // longitude and the saved address is never read (the API response omits
        // it anyway). Either way, when no coordinates resolve the search is
        // empty (location-driven, no global fallback) — usingFallback signals
        // the frontend to prompt for an address.
        $address = $location === null ? $this->selectedAddressFor($profile) : null;
        $resolved = $location ?? LocationContext::fromAddress($address);
        $radius = max(0.1, $this->config->float(
            PlatformConfigService::KEY_DASHBOARD_RADIUS_MILES,
            5.0,
        ));
        $hasGeo = $resolved->hasCoordinates();

        if ($keyword === '' || ! $profile) {
            $empty = $this->emptyPaginator($page, $perPage);

            return new CustomerSearchResults(
                type: $type,
                keyword: '',
                restaurants: collect(),
                dishesByRestaurant: collect(),
                recent: $profile ? $this->recentHistory($profile) : collect(),
                address: $address,
                radiusMiles: $radius,
                usingFallback: ! $hasGeo,
                restaurantsMeta: PaginationMeta::make($empty),
                filters: $filters,
            );
        }

        // Only record a fresh history row on the first page — pagination
        // requests for the same keyword shouldn't duplicate the row.
        if ($page === 1) {
            $this->recordSearch($profile, $keyword);
        }

        $paginator = $type === self::TYPE_ITEMS
            ? $this->paginateItemRestaurants($keyword, $resolved, $radius, $page, $perPage, $filters)
            : $this->paginateNameRestaurants($keyword, $resolved, $radius, $page, $perPage, $filters);

        // Keep the keyword + active filters on the pagination links so paging
        // within a filtered search round-trips correctly.
        $paginator->appends(array_filter([
            'search' => $keyword,
            'offers' => $filters['offers'] ? 1 : null,
            'highest_rated' => $filters['highest_rated'] ? 1 : null,
        ]));

        return new CustomerSearchResults(
            type: $type,
            keyword: $keyword,
            restaurants: $type === self::TYPE_ITEMS ? collect() : collect($paginator->items()),
            dishesByRestaurant: $type === self::TYPE_ITEMS ? collect($paginator->items()) : collect(),
            recent: $this->recentHistory($profile),
            address: $address,
            radiusMiles: $radius,
            usingFallback: ! $hasGeo,
            restaurantsMeta: PaginationMeta::make($paginator),
            filters: $filters,
        );
    }

    protected function emptyPaginator(int $page, int $perPage): LengthAwarePaginator
    {
        return new LengthAwarePaginatorImpl(items: [], total: 0, perPage: $perPage, currentPage: $page);
    }

    public function clearHistory(User $user): int
    {
        $profile = $user->customerProfile;
        if (! $profile) {
            return 0;
        }

        return CustomerSearchHistory::query()
            ->where('customer_profile_id', $profile->id)
            ->delete();
    }

    public function recentSearches(User $user): Collection
    {
        $profile = $user->customerProfile;

        return $profile ? $this->recentHistory($profile) : collect();
    }

    protected function selectedAddressFor(?CustomerProfile $profile): ?CustomerAddress
    {
        if (! $profile) {
            return null;
        }

        return $profile->selectedAddress()->first()
            ?? $profile->defaultAddress()->first()
            ?? $profile->addresses()->latest('id')->first();
    }

    /**
     * @return Collection<int, CustomerSearchHistory>
     */
    protected function recentHistory(CustomerProfile $profile): Collection
    {
        return CustomerSearchHistory::query()
            ->where('customer_profile_id', $profile->id)
            ->orderByDesc('searched_at')
            ->orderByDesc('id')
            ->limit(50)
            ->get()
            ->unique(fn ($row) => mb_strtolower($row->keyword))
            ->values()
            ->take(self::RECENT_LIMIT);
    }

    protected function recordSearch(CustomerProfile $profile, string $keyword): void
    {
        CustomerSearchHistory::create([
            'customer_profile_id' => $profile->id,
            'keyword' => $keyword,
            'searched_at' => Carbon::now(),
        ]);
    }

    /**
     * Restaurants tab: paginate restaurants matched by name OR an offered food
     * type. Geo-aware (radius + distance sort) when coordinates resolve,
     * otherwise empty (location-driven — no global fallback). No dishes nested.
     *
     * @param  array{offers: bool, highest_rated: bool}  $filters
     * @return LengthAwarePaginator<int, array{restaurant: Restaurant, distance_miles: ?float}>
     */
    protected function paginateNameRestaurants(string $keyword, LocationContext $location, float $radius, int $page, int $perPage, array $filters): LengthAwarePaginator
    {
        $query = Restaurant::query()
            ->active()
            ->approved()
            ->with(['uploads', 'hours'])
            ->matchingNameOrFoodType($keyword)
            ->when($filters['offers'], fn (Builder $q) => $q->withOffers())
            ->when($filters['highest_rated'], fn (Builder $q) => $q->highRated());

        $this->applyLocationOrder($query, $location, $radius);

        $paginator = $query->paginate(perPage: $perPage, page: $page);

        $paginator->setCollection($paginator->getCollection()
            ->map(fn (Restaurant $r) => [
                'restaurant' => $r,
                'distance_miles' => $r->distance_miles !== null
                    ? round((float) $r->distance_miles, 2)
                    : null,
            ])->values());

        return $paginator;
    }

    /**
     * Items tab: paginate restaurants that have at least one available,
     * keyword-matching dish (restaurant-name matches do NOT qualify), then
     * nest up to {@see ITEMS_PER_RESTAURANT} matching dishes under each. Only
     * the current page's restaurants are hydrated with dishes.
     *
     * Out-of-order (paused) and closed (outside operating hours) restaurants
     * are deliberately kept in the result set — the frontend grays them out and
     * strips the Add button rather than hiding them. `is_accepting_orders` +
     * `is_open_now` ride along on the resource so each surface can do that.
     *
     * @param  array{offers: bool, highest_rated: bool}  $filters
     * @return LengthAwarePaginator<int, array{restaurant: Restaurant, distance_miles: ?float, dishes: Collection<int, MenuItem>}>
     */
    protected function paginateItemRestaurants(string $keyword, LocationContext $location, float $radius, int $page, int $perPage, array $filters): LengthAwarePaginator
    {
        $query = Restaurant::query()
            ->active()
            ->approved()
            ->with(['uploads', 'hours'])
            ->whereHas('menuItems', fn (Builder $q) => $q->matchingKeyword($keyword))
            ->when($filters['offers'], fn (Builder $q) => $q->withOffers())
            ->when($filters['highest_rated'], fn (Builder $q) => $q->highRated());

        $this->applyLocationOrder($query, $location, $radius);

        $paginator = $query->paginate(perPage: $perPage, page: $page);

        $restaurantIds = $paginator->getCollection()->pluck('id')->all();

        // Matching dishes for just this page's restaurants, capped per
        // restaurant below so the payload stays small. Unavailable dishes are
        // kept (the frontend grays them with no Add button) but sorted after
        // available ones so the cap favours orderable dishes.
        $dishesByRestaurant = empty($restaurantIds)
            ? collect()
            : MenuItem::query()
                ->with([
                    'foodType',
                    'modifierGroups.options',
                    'uploads' => fn ($q) => $q->where('collection', 'image'),
                ])
                ->whereIn('restaurant_id', $restaurantIds)
                ->matchingKeyword($keyword)
                ->orderByDesc('is_available')
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get()
                ->groupBy('restaurant_id');

        $paginator->setCollection($paginator->getCollection()
            ->map(fn (Restaurant $r) => [
                'restaurant' => $r,
                'distance_miles' => $r->distance_miles !== null
                    ? round((float) $r->distance_miles, 2)
                    : null,
                'dishes' => collect($dishesByRestaurant->get($r->id) ?? [])
                    ->take(self::ITEMS_PER_RESTAURANT)
                    ->values(),
            ])->values());

        return $paginator;
    }

    /**
     * Shared ordering for both tabs: radius scope + distance sort when
     * coordinates resolve (mirrors the dashboard restaurant list). Search is
     * location-driven on every surface — when no coordinates resolve (no
     * lat/long on the API, no geocoded address on the web) the query is forced
     * empty rather than falling back to a global list, matching the dashboard.
     */
    protected function applyLocationOrder(Builder $query, LocationContext $location, float $radius): void
    {
        if ($location->hasCoordinates()) {
            $query->withinRadius($location->lat, $location->lng, $radius)
                ->orderByDesc('rating')
                ->orderBy('distance_miles');
        } else {
            // No "nearby" without coordinates → no results (no global fallback).
            $query->whereRaw('1 = 0');
        }
    }
}
