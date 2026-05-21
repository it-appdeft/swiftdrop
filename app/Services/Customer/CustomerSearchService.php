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
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class CustomerSearchService implements CustomerSearchServiceInterface
{
    protected const RECENT_LIMIT = 10;

    protected const RESULT_LIMIT = 30;

    public function __construct(
        protected PlatformConfigService $config,
    ) {
    }

    public function search(User $user, string $keyword): CustomerSearchResults
    {
        $profile = $user->customerProfile;
        $keyword = trim($keyword);

        $address = $this->selectedAddressFor($profile);
        $radius = max(0.1, $this->config->float(
            PlatformConfigService::KEY_DASHBOARD_RADIUS_MILES,
            5.0,
        ));

        if ($keyword === '' || ! $profile) {
            return new CustomerSearchResults(
                keyword: '',
                restaurants: collect(),
                menuItems: collect(),
                recent: $profile ? $this->recentHistory($profile) : collect(),
                address: $address,
                radiusMiles: $radius,
                usingFallback: ! $address || $address->lat === null || $address->lng === null,
            );
        }

        $this->recordSearch($profile, $keyword);

        $hasGeo = $address && $address->lat !== null && $address->lng !== null;
        [$restaurants, $menuItems] = $hasGeo
            ? $this->searchWithinRadius($keyword, $address, $radius)
            : $this->searchUnbounded($keyword);

        return new CustomerSearchResults(
            keyword: $keyword,
            restaurants: $restaurants,
            menuItems: $menuItems,
            recent: $this->recentHistory($profile),
            address: $address,
            radiusMiles: $radius,
            usingFallback: ! $hasGeo,
        );
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
        // Dedupe by keyword (case-insensitive) keeping the most recent timestamp.
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
     * @return array{0: Collection, 1: Collection}
     */
    protected function searchWithinRadius(string $keyword, CustomerAddress $address, float $radius): array
    {
        $distanceExpr = $this->distanceExpression(
            (float) $address->lat,
            (float) $address->lng,
            'restaurants.lat',
            'restaurants.lng',
        );

        $restaurants = $this->activeRestaurantsQuery()
            ->whereNotNull('restaurants.lat')
            ->whereNotNull('restaurants.lng')
            ->where('restaurants.name', 'like', "%{$keyword}%")
            ->selectRaw("restaurants.*, {$distanceExpr} as distance_miles")
            ->whereRaw("{$distanceExpr} <= ?", [$radius])
            ->orderBy('distance_miles')
            ->limit(self::RESULT_LIMIT)
            ->get()
            ->map(fn (Restaurant $r) => [
                'restaurant' => $r,
                'distance_miles' => $r->distance_miles !== null
                    ? round((float) $r->distance_miles, 2)
                    : null,
            ])
            ->values();

        $menuItems = MenuItem::query()
            ->join('restaurants', 'restaurants.id', '=', 'menu_items.restaurant_id')
            ->leftJoin('food_items', 'food_items.id', '=', 'menu_items.food_item_id')
            ->where('restaurants.status', 'active')
            ->where('restaurants.approval_status', 'approved')
            ->whereNotNull('restaurants.lat')
            ->whereNotNull('restaurants.lng')
            ->where('menu_items.is_available', true)
            ->where(function ($q) use ($keyword) {
                $q->where('menu_items.name', 'like', "%{$keyword}%")
                    ->orWhere('food_items.name', 'like', "%{$keyword}%")
                    ->orWhere('food_items.slug', 'like', "%{$keyword}%");
            })
            ->selectRaw('menu_items.*, '.$distanceExpr.' as distance_miles')
            ->whereRaw("{$distanceExpr} <= ?", [$radius])
            ->orderBy('distance_miles')
            ->limit(self::RESULT_LIMIT)
            ->get()
            ->map(fn (MenuItem $m) => [
                'menu_item' => $m,
                'restaurant' => $m->restaurant,
                'distance_miles' => $m->distance_miles !== null
                    ? round((float) $m->distance_miles, 2)
                    : null,
            ])
            ->values();

        return [$restaurants, $menuItems];
    }

    /**
     * Customer has no usable geo — degrade gracefully to a plain text match.
     *
     * @return array{0: Collection, 1: Collection}
     */
    protected function searchUnbounded(string $keyword): array
    {
        $restaurants = $this->activeRestaurantsQuery()
            ->where('restaurants.name', 'like', "%{$keyword}%")
            ->limit(self::RESULT_LIMIT)
            ->get()
            ->map(fn (Restaurant $r) => ['restaurant' => $r, 'distance_miles' => null])
            ->values();

        $menuItems = MenuItem::query()
            ->join('restaurants', 'restaurants.id', '=', 'menu_items.restaurant_id')
            ->leftJoin('food_items', 'food_items.id', '=', 'menu_items.food_item_id')
            ->where('restaurants.status', 'active')
            ->where('restaurants.approval_status', 'approved')
            ->where('menu_items.is_available', true)
            ->where(function ($q) use ($keyword) {
                $q->where('menu_items.name', 'like', "%{$keyword}%")
                    ->orWhere('food_items.name', 'like', "%{$keyword}%")
                    ->orWhere('food_items.slug', 'like', "%{$keyword}%");
            })
            ->select('menu_items.*')
            ->limit(self::RESULT_LIMIT)
            ->get()
            ->map(fn (MenuItem $m) => [
                'menu_item' => $m,
                'restaurant' => $m->restaurant,
                'distance_miles' => null,
            ])
            ->values();

        return [$restaurants, $menuItems];
    }

    protected function activeRestaurantsQuery(): Builder
    {
        return Restaurant::query()
            ->where('restaurants.status', 'active')
            ->where('restaurants.approval_status', 'approved');
    }

    protected function distanceExpression(float $lat, float $lng, string $latColumn, string $lngColumn): string
    {
        $earth = 3958.7613; // miles

        return "({$earth} * acos("
            ."cos(radians({$lat})) * cos(radians({$latColumn})) * "
            ."cos(radians({$lngColumn}) - radians({$lng})) + "
            ."sin(radians({$lat})) * sin(radians({$latColumn}))"
            ."))";
    }
}
