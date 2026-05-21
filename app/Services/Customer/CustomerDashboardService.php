<?php

namespace App\Services\Customer;

use App\Contracts\Customer\CustomerDashboardServiceInterface;
use App\DTO\Customer\CustomerDashboardData;
use App\Models\CustomerAddress;
use App\Models\FoodItem;
use App\Models\Restaurant;
use App\Models\User;
use App\Services\Platform\PlatformConfigService;
use Illuminate\Database\Eloquent\Builder;
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

        $foodItems = FoodItem::query()->orderBy('id')->get();
        $address = $this->defaultAddressFor($user);

        if ($address && $address->lat !== null && $address->lng !== null) {
            $restaurants = $this->restaurantsNear($address, $radius);
            $usingFallback = false;
        } else {
            $restaurants = $this->fallbackRestaurants($fallbackLimit);
            $usingFallback = true;
        }

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
     * Haversine on the SQL side keeps the radius filter index-friendly and
     * sortable without pulling every row into PHP. Sort by rating desc, then
     * by distance asc — matches the configured priority.
     *
     * @return Collection<int, array{restaurant: Restaurant, distance_miles: ?float}>
     */
    protected function restaurantsNear(CustomerAddress $address, float $radiusMiles): Collection
    {
        $lat = (float) $address->lat;
        $lng = (float) $address->lng;
        // Earth radius in miles.
        $earth = 3958.7613;

        $distance = "({$earth} * acos("
            ."cos(radians({$lat})) * cos(radians(`lat`)) * "
            ."cos(radians(`lng`) - radians({$lng})) + "
            ."sin(radians({$lat})) * sin(radians(`lat`))"
            ."))";

        return $this->activeRestaurantsQuery()
            ->whereNotNull('lat')
            ->whereNotNull('lng')
            ->selectRaw("restaurants.*, {$distance} as distance_miles")
            ->whereRaw("{$distance} <= ?", [$radiusMiles])
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
        return $this->activeRestaurantsQuery()
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(fn (Restaurant $r) => ['restaurant' => $r, 'distance_miles' => null])
            ->values();
    }

    protected function activeRestaurantsQuery(): Builder
    {
        return Restaurant::query()
            ->where('status', 'active')
            ->where('approval_status', 'approved');
    }
}
