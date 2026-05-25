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
use Illuminate\Support\Facades\DB;

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
                dishesByRestaurant: collect(),
                recent: $profile ? $this->recentHistory($profile) : collect(),
                address: $address,
                radiusMiles: $radius,
                usingFallback: ! $address || $address->lat === null || $address->lng === null,
            );
        }

        $this->recordSearch($profile, $keyword);

        $hasGeo = $address && $address->lat !== null && $address->lng !== null;
        [$restaurants, $dishesByRestaurant] = $hasGeo
            ? $this->searchWithinRadius($keyword, $address, $radius)
            : $this->searchUnbounded($keyword);

        return new CustomerSearchResults(
            keyword: $keyword,
            restaurants: $restaurants,
            dishesByRestaurant: $dishesByRestaurant,
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
        $lat = (float) $address->lat;
        $lng = (float) $address->lng;
        $distanceExpr = Restaurant::distanceMilesExpression($lat, $lng);

        $restaurants = Restaurant::query()
            ->active()
            ->approved()
            ->where(fn ($q) => $this->applyRestaurantNameOrFoodItemMatch($q, $keyword))
            ->withinRadius($lat, $lng, $radius)
            ->orderBy('distance_miles')
            ->limit(self::RESULT_LIMIT)
            ->get();

        $dishesByRestaurant = $this->dishesGroupedByRestaurant(
            $keyword,
            geoFilter: function (Builder $q) use ($distanceExpr, $radius) {
                $q->whereNotNull('restaurants.lat')
                    ->whereNotNull('restaurants.lng')
                    ->whereRaw("{$distanceExpr} <= ?", [$radius]);
            },
            distanceExpr: $distanceExpr,
        );

        return [
            $restaurants->map(fn (Restaurant $r) => [
                'restaurant' => $r,
                'distance_miles' => $r->distance_miles !== null
                    ? round((float) $r->distance_miles, 2)
                    : null,
            ])->values(),
            $dishesByRestaurant,
        ];
    }

    /**
     * @return array{0: Collection, 1: Collection}
     */
    protected function searchUnbounded(string $keyword): array
    {
        $restaurants = Restaurant::query()
            ->active()
            ->approved()
            ->where(fn ($q) => $this->applyRestaurantNameOrFoodItemMatch($q, $keyword))
            ->limit(self::RESULT_LIMIT)
            ->get()
            ->map(fn (Restaurant $r) => ['restaurant' => $r, 'distance_miles' => null])
            ->values();

        $dishesByRestaurant = $this->dishesGroupedByRestaurant(
            $keyword,
            geoFilter: null,
            distanceExpr: null,
        );

        return [$restaurants, $dishesByRestaurant];
    }

    /**
     * Restaurant matches when its own name matches the keyword, OR it has
     * at least one available menu item linked to a food_item whose name
     * (or the menu item's own name) matches the keyword.
     */
    protected function applyRestaurantNameOrFoodItemMatch(Builder $query, string $keyword): void
    {
        $query
            ->where('restaurants.name', 'like', "%{$keyword}%")
            ->orWhereExists(function ($sub) use ($keyword) {
                $sub->select(DB::raw(1))
                    ->from('menu_items')
                    ->leftJoin('food_items', 'food_items.id', '=', 'menu_items.food_item_id')
                    ->whereColumn('menu_items.restaurant_id', 'restaurants.id')
                    ->where('menu_items.is_available', true)
                    ->where(function ($w) use ($keyword) {
                        $w->where('food_items.name', 'like', "%{$keyword}%")
                            ->orWhere('menu_items.name', 'like', "%{$keyword}%");
                    });
            });
    }

    /**
     * Build the Dishes tab payload: restaurants that have at least one
     * matching menu item, each with its matching dishes nested inside.
     *
     * @param  ?callable(Builder): void  $geoFilter
     * @return Collection<int, array{restaurant: Restaurant, distance_miles: ?float, dishes: Collection<int, MenuItem>}>
     */
    protected function dishesGroupedByRestaurant(string $keyword, ?callable $geoFilter, ?string $distanceExpr): Collection
    {
        $menuQuery = MenuItem::query()
            ->with('foodItem')
            ->join('restaurants', 'restaurants.id', '=', 'menu_items.restaurant_id')
            ->leftJoin('food_items', 'food_items.id', '=', 'menu_items.food_item_id')
            ->where('restaurants.status', 'active')
            ->where('restaurants.approval_status', 'approved')
            ->where('menu_items.is_available', true)
            ->where(function ($q) use ($keyword) {
                $q->where('food_items.name', 'like', "%{$keyword}%")
                    ->orWhere('menu_items.name', 'like', "%{$keyword}%");
            });

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
