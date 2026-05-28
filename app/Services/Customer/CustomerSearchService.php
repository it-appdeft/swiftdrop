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
use App\Support\PaginationMeta;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator as LengthAwarePaginatorImpl;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CustomerSearchService implements CustomerSearchServiceInterface
{
    protected const RECENT_LIMIT = 10;

    protected const RESULT_LIMIT = 30;

    public const RESTAURANTS_PER_PAGE = 10;

    public function __construct(
        protected PlatformConfigService $config,
    ) {
    }

    public function search(User $user, string $keyword, int $page = 1, int $perPage = self::RESTAURANTS_PER_PAGE, array $filters = []): CustomerSearchResults
    {
        $profile = $user->customerProfile;
        $keyword = trim($keyword);
        $filters = [
            'offers' => (bool) ($filters['offers'] ?? false),
            'highest_rated' => (bool) ($filters['highest_rated'] ?? false),
        ];

        $address = $this->selectedAddressFor($profile);
        $radius = max(0.1, $this->config->float(
            PlatformConfigService::KEY_DASHBOARD_RADIUS_MILES,
            5.0,
        ));

        if ($keyword === '' || ! $profile) {
            $empty = $this->emptyPaginator($page, $perPage);

            return new CustomerSearchResults(
                keyword: '',
                restaurants: collect(),
                dishesByRestaurant: collect(),
                recent: $profile ? $this->recentHistory($profile) : collect(),
                address: $address,
                radiusMiles: $radius,
                usingFallback: ! $address || $address->lat === null || $address->lng === null,
                restaurantsMeta: PaginationMeta::make($empty),
                filters: $filters,
            );
        }

        // Only record a fresh history row on the first page — pagination
        // requests for the same keyword shouldn't duplicate the row.
        if ($page === 1) {
            $this->recordSearch($profile, $keyword);
        }

        $hasGeo = $address && $address->lat !== null && $address->lng !== null;
        [$restaurantsPaginator, $dishesByRestaurant] = $hasGeo
            ? $this->searchWithinRadius($keyword, $address, $radius, $page, $perPage, $filters)
            : $this->searchUnbounded($keyword, $page, $perPage, $filters);

        // Keep the keyword + active filters on the pagination links so paging
        // within a filtered search round-trips correctly.
        $restaurantsPaginator->appends(array_filter([
            'search' => $keyword,
            'offers' => $filters['offers'] ? 1 : null,
            'highest_rated' => $filters['highest_rated'] ? 1 : null,
        ]));

        return new CustomerSearchResults(
            keyword: $keyword,
            restaurants: collect($restaurantsPaginator->items()),
            dishesByRestaurant: $dishesByRestaurant,
            recent: $this->recentHistory($profile),
            address: $address,
            radiusMiles: $radius,
            usingFallback: ! $hasGeo,
            restaurantsMeta: PaginationMeta::make($restaurantsPaginator),
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
     * @param  array{offers: bool, highest_rated: bool}  $filters
     * @return array{0: LengthAwarePaginator, 1: Collection}
     */
    protected function searchWithinRadius(string $keyword, CustomerAddress $address, float $radius, int $page, int $perPage, array $filters): array
    {
        $lat = (float) $address->lat;
        $lng = (float) $address->lng;
        $distanceExpr = Restaurant::distanceMilesExpression($lat, $lng);

        $paginator = Restaurant::query()
            ->active()
            ->approved()
            // Keyword + Offers + Highest rated in one scope.
            ->customerSearch(['keyword' => $keyword, ...$filters])
            ->withinRadius($lat, $lng, $radius)
            ->orderBy('distance_miles')
            ->paginate(perPage: $perPage, page: $page);

        $paginator->setCollection($paginator->getCollection()
            ->map(fn (Restaurant $r) => [
                'restaurant' => $r,
                'distance_miles' => $r->distance_miles !== null
                    ? round((float) $r->distance_miles, 2)
                    : null,
            ])->values());

        $dishesByRestaurant = $this->dishesGroupedByRestaurant(
            $keyword,
            geoFilter: function (Builder $q) use ($distanceExpr, $radius) {
                $q->whereNotNull('restaurants.lat')
                    ->whereNotNull('restaurants.lng')
                    ->whereRaw("{$distanceExpr} <= ?", [$radius]);
            },
            distanceExpr: $distanceExpr,
            filters: $filters,
        );

        return [$paginator, $dishesByRestaurant];
    }

    /**
     * @param  array{offers: bool, highest_rated: bool}  $filters
     * @return array{0: LengthAwarePaginator, 1: Collection}
     */
    protected function searchUnbounded(string $keyword, int $page, int $perPage, array $filters): array
    {
        $paginator = Restaurant::query()
            ->active()
            ->approved()
            ->customerSearch(['keyword' => $keyword, ...$filters])
            ->paginate(perPage: $perPage, page: $page);

        $paginator->setCollection($paginator->getCollection()
            ->map(fn (Restaurant $r) => ['restaurant' => $r, 'distance_miles' => null])
            ->values());

        $dishesByRestaurant = $this->dishesGroupedByRestaurant(
            $keyword,
            geoFilter: null,
            distanceExpr: null,
            filters: $filters,
        );

        return [$paginator, $dishesByRestaurant];
    }

    /**
     * Build the Dishes tab payload: restaurants that have at least one
     * matching menu item, each with its matching dishes nested inside.
     *
     * @param  ?callable(Builder): void  $geoFilter
     * @param  array{offers: bool, highest_rated: bool}  $filters
     * @return Collection<int, array{restaurant: Restaurant, distance_miles: ?float, dishes: Collection<int, MenuItem>}>
     */
    protected function dishesGroupedByRestaurant(string $keyword, ?callable $geoFilter, ?string $distanceExpr, array $filters = []): Collection
    {
        $menuQuery = MenuItem::query()
            ->with(['foodItem', 'modifierGroups.options'])
            ->join('restaurants', 'restaurants.id', '=', 'menu_items.restaurant_id')
            ->leftJoin('food_items', 'food_items.id', '=', 'menu_items.food_item_id')
            ->where('restaurants.status', 'active')
            ->where('restaurants.approval_status', 'approved')
            ->where('menu_items.is_available', true)
            ->where(function ($q) use ($keyword) {
                $q->where('food_items.name', 'like', "%{$keyword}%")
                    ->orWhere('menu_items.name', 'like', "%{$keyword}%");
            });

        // Same Offers / Highest rated filters as the restaurants tab, applied
        // against the joined `restaurants` table. The offers predicate reuses
        // the exact constraint behind Restaurant::scopeWithOffers().
        if (! empty($filters['highest_rated'])) {
            $menuQuery->where('restaurants.rating', '>=', Restaurant::HIGH_RATING);
        }
        if (! empty($filters['offers'])) {
            $menuQuery->whereExists(fn ($sub) => Restaurant::applyOfferExists($sub));
        }

        if ($geoFilter) {
            $geoFilter($menuQuery);
        }

        $select = ['menu_items.*'];
        if ($distanceExpr) {
            $select[] = DB::raw("{$distanceExpr} as distance_miles");
        }

        $items = $menuQuery
            ->select($select)
            ->orderBy('restaurants.id')
            ->orderBy('menu_items.sort_order')
            ->limit(self::RESULT_LIMIT * 5)
            ->get();

        if ($items->isEmpty()) {
            return collect();
        }

        $restaurantIds = $items->pluck('restaurant_id')->unique()->all();
        $restaurants = Restaurant::query()
            ->whereIn('id', $restaurantIds)
            ->get()
            ->keyBy('id');

        return $items
            ->groupBy('restaurant_id')
            ->map(function (Collection $dishes, int $restaurantId) use ($restaurants) {
                $restaurant = $restaurants->get($restaurantId);
                if (! $restaurant) {
                    return null;
                }
                $distance = $dishes->first()->distance_miles ?? null;

                return [
                    'restaurant' => $restaurant,
                    'distance_miles' => $distance !== null ? round((float) $distance, 2) : null,
                    'dishes' => $dishes->values(),
                ];
            })
            ->filter()
            ->values()
            ->take(self::RESULT_LIMIT);
    }

}
