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
     * orders), near the customer's selected address and highly rated, ordered
     * by rating. Falls back to the global highest-rated list when the customer
     * has no geocoded address.
     *
     * @return Collection<int, array{restaurant: Restaurant, distance_miles: ?float, is_favorited: bool}>
     */
    public function topPicks(?User $user, int $limit = self::TOP_PICKS_LIMIT, ?int $foodTypeId = null): Collection
    {
        $address = $this->selectedAddress($user);
        $radius = $this->dashboardRadius();
        $favoriteIds = $user ? array_flip($this->favorites->favoriteRestaurantIds($user)) : [];

        $query = Restaurant::query()
            ->bookable()
            ->with('uploads')
            ->highRated()
            ->orderByDesc('rating');

        if ($foodTypeId !== null) {
            $query->offeringFoodType($foodTypeId);
        }

        if ($address && $address->lat !== null && $address->lng !== null) {
            $query->withinRadius((float) $address->lat, (float) $address->lng, $radius)
                ->orderBy('distance_miles');
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
        ?int $foodTypeId = null,
        string $pageName = 'page',
    ): LengthAwarePaginator {
        $address = $this->defaultAddressFor($user);
        $radius = $this->dashboardRadius();

        $hasGeo = $address && $address->lat !== null && $address->lng !== null;

        // Eager-load uploads so the logo_url / banner_url accessors resolve
        // without an N+1 across the list.
        $query = Restaurant::query()->active()->approved()->with('uploads');
        if ($hasGeo) {
            $query->withinRadius((float) $address->lat, (float) $address->lng, $radius)
                ->orderByDesc('rating')
                ->orderBy('distance_miles');
        } else {
            $query->orderByDesc('created_at');
        }

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
