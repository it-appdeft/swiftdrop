<?php

namespace App\Services\Customer;

use App\Contracts\Customer\CustomerDashboardServiceInterface;
use App\Contracts\Customer\CustomerFavoriteServiceInterface;
use App\DTO\Customer\CustomerDashboardData;
use App\Models\CustomerAddress;
use App\Models\FoodType;
use App\Models\Restaurant;
use App\Models\User;
use App\Services\Platform\PlatformConfigService;
use App\Support\Location\LocationContext;
use App\Support\PaginationMeta;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class CustomerDashboardService implements CustomerDashboardServiceInterface
{
    /** Default page size for the customer-facing restaurants list (home + index). */
    public const RESTAURANTS_PER_PAGE = 10;

    /** Explore strip size — first N food items, shown regardless of location. */
    public const FOOD_ITEMS_LIMIT = 20;

    /** Top-picks slider size. */
    public const TOP_PICKS_LIMIT = 5;

    /**
     * Minimum rating a restaurant needs to qualify as a "top pick". Lower than
     * the global {@see Restaurant::HIGH_RATING} (the explicit "highest rated"
     * filter) so the slider is populated in newer markets, while still
     * excluding unrated (0.00) restaurants.
     */
    public const TOP_PICKS_MIN_RATING = 1.0;

    public function __construct(
        protected PlatformConfigService $config,
        protected CustomerFavoriteServiceInterface $favorites,
    ) {
    }

    public function build(
        ?User $user,
        int $restaurantsPage = 1,
        ?int $foodTypeId = null,
    ): CustomerDashboardData {
        $radius = $this->dashboardRadius();
        $address = $this->selectedAddress($user);
        $usingFallback = ! ($address && $address->lat !== null && $address->lng !== null);

        // Restaurants — paginated; the only paginated section on the page. The
        // active food-type filter (if any) narrows it.
        $restaurantsPaginator = $this->paginateRestaurants(
            $user,
            page: $restaurantsPage,
            perPage: self::RESTAURANTS_PER_PAGE,
            foodTypeId: $foodTypeId,
        );
        /** @var Collection<int, array{restaurant: Restaurant, distance_miles: ?float, is_favorited: bool}> $restaurants */
        $restaurants = collect($restaurantsPaginator->items());

        $restaurantsPaginator->appends(array_filter(['search' => $foodTypeId]));

        $selectedFoodType = $foodTypeId !== null ? FoodType::query()->find($foodTypeId) : null;

        return new CustomerDashboardData(
            foodTypes: $this->foodTypes(),
            topPicks: $this->topPicks($user, foodTypeId: $foodTypeId),
            restaurants: $restaurants,
            address: $address,
            radiusMiles: $radius,
            usingFallback: $usingFallback,
            restaurantsMeta: PaginationMeta::make($restaurantsPaginator),
            selectedFoodType: $selectedFoodType,
        );
    }

    /** The customer's active delivery address (selected → default → newest). */
    public function selectedAddress(?User $user): ?CustomerAddress
    {
        return $this->defaultAddressFor($user);
    }

    /**
     * First N food items shown in the Explore strip — no location check, so
     * the catalogue is always populated.
     *
     * @return Collection<int, FoodType>
     */
    public function foodTypes(int $limit = self::FOOD_ITEMS_LIMIT): Collection
    {
        return FoodType::query()->orderBy('id')->limit($limit)->get();
    }

    /**
     * Top picks: restaurants that are bookable (live + approved + accepting
     * orders), near the resolved location and reasonably rated (rating >=
     * {@see TOP_PICKS_MIN_RATING}, so unrated 0.00 restaurants are skipped),
     * ordered by rating.
     *
     * Discovery is location-driven on every surface — see {@see resolveLocation()}:
     * web callers omit `$location` and the coordinates come from the customer's
     * selected address; API callers pass an explicit context built from the
     * frontend latitude/longitude. When no usable coordinates resolve (no
     * geocoded address on the web, no lat/long on the API) the list comes back
     * empty: there is no "nearby", so we never substitute a global list. The
     * frontend prompts the customer to set an address instead.
     *
     * @return Collection<int, array{restaurant: Restaurant, distance_miles: ?float, is_favorited: bool}>
     */
    public function topPicks(?User $user, int $limit = self::TOP_PICKS_LIMIT, ?int $foodTypeId = null, ?LocationContext $location = null): Collection
    {
        $location = $this->resolveLocation($user, $location);

        // No usable coordinates → nothing is "nearby"; return an empty list
        // rather than a global fallback (same rule for web and API).
        if (! $location->hasCoordinates()) {
            return collect();
        }

        $radius = $this->dashboardRadius();
        $favoriteIds = $user ? array_flip($this->favorites->favoriteRestaurantIds($user)) : [];

        $query = Restaurant::query()
            ->bookable()
            ->with('uploads')
            ->highRated(self::TOP_PICKS_MIN_RATING)
            ->orderByDesc('rating')
            ->withinRadius($location->lat, $location->lng, $radius)
            ->orderBy('distance_miles');

        if ($foodTypeId !== null) {
            $query->offeringFoodType($foodTypeId);
        }

        return $query->limit($limit)->get()
            ->map(fn (Restaurant $r) => [
                'restaurant' => $r,
                'distance_miles' => $r->distance_miles !== null ? round((float) $r->distance_miles, 2) : null,
                'is_favorited' => isset($favoriteIds[$r->id]),
            ])
            ->values();
    }

    /**
     * Paginated restaurants for the customer surfaces (home + /customer/restaurants index).
     * Geo-aware: results are scoped to the discovery radius and sorted by
     * distance.
     *
     * Discovery is location-driven on every surface — see {@see resolveLocation()}:
     * web callers omit `$location` and use the customer's saved address; API
     * callers pass an explicit context from the frontend latitude/longitude.
     * When no usable coordinates resolve (no geocoded address on the web, no
     * lat/long on the API) the page comes back empty rather than substituting a
     * global list — the frontend prompts the customer to set an address.
     *
     * Each row carries `is_favorited` so the frontend can flip the heart icon
     * without a second roundtrip.
     */
    public function paginateRestaurants(
        ?User $user,
        int $page = 1,
        int $perPage = self::RESTAURANTS_PER_PAGE,
        ?int $foodTypeId = null,
        string $pageName = 'page',
        ?LocationContext $location = null,
    ): LengthAwarePaginator {
        $location = $this->resolveLocation($user, $location);

        // No usable coordinates → nothing is "nearby"; return an empty page
        // rather than a global fallback (same rule for web and API).
        if (! $location->hasCoordinates()) {
            return $this->emptyPaginator($page, $perPage, $pageName);
        }

        $radius = $this->dashboardRadius();

        // Eager-load uploads so the logo_url / banner_url accessors resolve
        // without an N+1 across the list.
        $query = Restaurant::query()->active()->approved()->with('uploads')
            ->withinRadius($location->lat, $location->lng, $radius)
            ->orderByDesc('rating')
            ->orderBy('distance_miles');

        if ($foodTypeId !== null) {
            $query->offeringFoodType($foodTypeId);
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

    /**
     * Empty page used when an API caller supplies no usable coordinates —
     * matches paginateRestaurants()'s shape (0 results, requested page size)
     * without touching the database.
     */
    protected function emptyPaginator(int $page, int $perPage, string $pageName): LengthAwarePaginator
    {
        return new \Illuminate\Pagination\LengthAwarePaginator([], 0, $perPage, $page, [
            'pageName' => $pageName,
            'path' => \Illuminate\Pagination\Paginator::resolveCurrentPath(),
        ]);
    }

    protected function dashboardRadius(): float
    {
        return max(0.1, $this->config->float(
            PlatformConfigService::KEY_DASHBOARD_RADIUS_MILES,
            5.0,
        ));
    }

    /**
     * Resolve the coordinate source for a discovery query.
     *
     * Web callers pass no context: we derive coordinates from the customer's
     * active address (selected → default → newest), which may itself be empty
     * (no address, or one without lat/lng). API callers pass an explicit context
     * built from the frontend latitude/longitude. Either way the result may be a
     * coordinate-less context; callers treat that as "no nearby results" (empty)
     * — see topPicks()/paginateRestaurants() — and never fall back to a global
     * list. The web saved address is the only address source; the API never
     * reads it.
     */
    protected function resolveLocation(?User $user, ?LocationContext $location): LocationContext
    {
        if ($location !== null) {
            return $location;
        }

        return LocationContext::fromAddress($this->selectedAddress($user));
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
