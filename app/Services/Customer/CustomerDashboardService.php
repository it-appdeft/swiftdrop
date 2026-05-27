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
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class CustomerDashboardService implements CustomerDashboardServiceInterface
{
    /** Default page size for the customer-facing restaurants list (home + index). */
    public const RESTAURANTS_PER_PAGE = 10;

    public function __construct(
        protected PlatformConfigService $config,
        protected CustomerFavoriteServiceInterface $favorites,
    ) {
    }

    public function build(?User $user): CustomerDashboardData
    {
        $radius = $this->dashboardRadius();
        $address = $this->defaultAddressFor($user);
        $usingFallback = ! ($address && $address->lat !== null && $address->lng !== null);

        // First page (10 rows) is what the home screen renders; the "View all"
        // page hits the same service method for subsequent pages.
        $paginator = $this->paginateRestaurants($user, page: 1, perPage: self::RESTAURANTS_PER_PAGE);
        /** @var Collection<int, array{restaurant: Restaurant, distance_miles: ?float, is_favorited: bool}> $restaurants */
        $restaurants = collect($paginator->items());

        // Only surface food types the displayed restaurants actually offer, so
        // the Explore row mirrors what's orderable in range (empty when nothing
        // is nearby). Distinctness is handled by the whereHas scope.
        $restaurantIds = $restaurants->pluck('restaurant.id')->all();
        $foodItems = FoodItem::query()
            ->availableForRestaurants($restaurantIds)
            ->orderBy('id')
            ->get();

        return new CustomerDashboardData(
            foodItems: $foodItems,
            restaurants: $restaurants,
            address: $address,
            radiusMiles: $radius,
            usingFallback: $usingFallback,
            restaurantsTotal: $paginator->total(),
            restaurantsPerPage: $paginator->perPage(),
            restaurantsLastPage: $paginator->lastPage(),
        );
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
    public function paginateRestaurants(?User $user, int $page = 1, int $perPage = self::RESTAURANTS_PER_PAGE): LengthAwarePaginator
    {
        $address = $this->defaultAddressFor($user);
        $radius = $this->dashboardRadius();

        if ($address && $address->lat !== null && $address->lng !== null) {
            $paginator = Restaurant::query()
                ->active()
                ->approved()
                ->withinRadius((float) $address->lat, (float) $address->lng, $radius)
                ->orderByDesc('rating')
                ->orderBy('distance_miles')
                ->paginate(perPage: $perPage, page: $page);
        } else {
            $paginator = Restaurant::query()
                ->active()
                ->approved()
                ->orderByDesc('created_at')
                ->paginate(perPage: $perPage, page: $page);
        }

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
