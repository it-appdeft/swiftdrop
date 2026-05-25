<?php

namespace App\Services\Customer;

use App\Contracts\Customer\CustomerDashboardServiceInterface;
use App\DTO\Customer\CustomerDashboardData;
use App\Models\CustomerAddress;
use App\Models\FoodItem;
use App\Models\Restaurant;
use App\Models\User;
use App\Services\Platform\PlatformConfigService;
use Illuminate\Support\Collection;

class CustomerDashboardService implements CustomerDashboardServiceInterface
{
    public function __construct(
        protected PlatformConfigService $config,
    ) {
    }

    public function build(?User $user): CustomerDashboardData
    {
        $radius = max(0.1, $this->config->float(
            PlatformConfigService::KEY_DASHBOARD_RADIUS_MILES,
            5.0,
        ));
        $fallbackLimit = max(1, $this->config->int(
            PlatformConfigService::KEY_DASHBOARD_FALLBACK_LIMIT,
            12,
        ));

        $address = $this->defaultAddressFor($user);

        if ($address && $address->lat !== null && $address->lng !== null) {
            $restaurants = $this->restaurantsNear($address, $radius);
            $usingFallback = false;
        } else {
            $restaurants = $this->fallbackRestaurants($fallbackLimit);
            $usingFallback = true;
        }

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
        );
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

    /**
     * In-range restaurants ordered by rating desc, then distance asc — matches
     * the configured priority. Filtering goes through the model scopes
     * ({@see Restaurant::scopeActive()}, scopeApproved(), scopeWithinRadius()).
     *
     * @return Collection<int, array{restaurant: Restaurant, distance_miles: ?float}>
     */
    protected function restaurantsNear(CustomerAddress $address, float $radiusMiles): Collection
    {
        return Restaurant::query()
            ->active()
            ->approved()
            ->withinRadius((float) $address->lat, (float) $address->lng, $radiusMiles)
            ->orderByDesc('rating')
            ->orderBy('distance_miles')
            ->get()
            ->map(fn (Restaurant $r) => [
                'restaurant' => $r,
                'distance_miles' => $r->distance_miles !== null
                    ? round((float) $r->distance_miles, 2)
                    : null,
            ])
            ->values();
    }

    /**
     * @return Collection<int, array{restaurant: Restaurant, distance_miles: ?float}>
     */
    protected function fallbackRestaurants(int $limit): Collection
    {
        return Restaurant::query()
            ->active()
            ->approved()
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(fn (Restaurant $r) => ['restaurant' => $r, 'distance_miles' => null])
            ->values();
    }
}
