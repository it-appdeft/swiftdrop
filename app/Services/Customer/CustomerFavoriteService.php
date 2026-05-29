<?php

namespace App\Services\Customer;

use App\Contracts\Customer\CustomerFavoriteServiceInterface;
use App\Models\CustomerFavoriteMenuItem;
use App\Models\CustomerFavoriteRestaurant;
use App\Models\CustomerProfile;
use App\Models\MenuItem;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Pagination\LengthAwarePaginator as LengthAwarePaginatorImpl;
use Illuminate\Support\Collection;

class CustomerFavoriteService implements CustomerFavoriteServiceInterface
{
    public function toggleRestaurant(User $user, int $restaurantId): bool
    {
        $profile = $this->requireProfile($user);

        // Confirm the restaurant exists (and is bookable). Without this an
        // attacker could spam IDs to fill the favourites table with junk.
        Restaurant::query()->active()->approved()->findOrFail($restaurantId);

        $existing = CustomerFavoriteRestaurant::query()
            ->where('customer_profile_id', $profile->id)
            ->where('restaurant_id', $restaurantId)
            ->first();

        if ($existing) {
            $existing->delete();

            return false;
        }

        CustomerFavoriteRestaurant::create([
            'customer_profile_id' => $profile->id,
            'restaurant_id' => $restaurantId,
        ]);

        return true;
    }

    public function toggleMenuItem(User $user, int $menuItemId): bool
    {
        $profile = $this->requireProfile($user);

        MenuItem::query()->findOrFail($menuItemId);

        $existing = CustomerFavoriteMenuItem::query()
            ->where('customer_profile_id', $profile->id)
            ->where('menu_item_id', $menuItemId)
            ->first();

        if ($existing) {
            $existing->delete();

            return false;
        }

        CustomerFavoriteMenuItem::create([
            'customer_profile_id' => $profile->id,
            'menu_item_id' => $menuItemId,
        ]);

        return true;
    }

    public function favoriteRestaurantIds(User $user): array
    {
        $profile = $user->customerProfile;
        if (! $profile) {
            return [];
        }

        return CustomerFavoriteRestaurant::query()
            ->where('customer_profile_id', $profile->id)
            ->pluck('restaurant_id')
            ->all();
    }

    public function favoriteMenuItemIds(User $user): array
    {
        $profile = $user->customerProfile;
        if (! $profile) {
            return [];
        }

        return CustomerFavoriteMenuItem::query()
            ->where('customer_profile_id', $profile->id)
            ->pluck('menu_item_id')
            ->all();
    }

    public function favoriteRestaurants(User $user): Collection
    {
        $profile = $user->customerProfile;
        if (! $profile) {
            return collect();
        }

        return $profile->favoriteRestaurants()
            ->orderByDesc('customer_favorite_restaurants.created_at')
            ->get();
    }

    public function favoriteMenuItems(User $user): Collection
    {
        $profile = $user->customerProfile;
        if (! $profile) {
            return collect();
        }

        return $profile->favoriteMenuItems()
            ->with('foodType')
            ->orderByDesc('customer_favorite_menu_items.created_at')
            ->get();
    }

    public function paginateFavoriteRestaurants(User $user, int $page = 1, int $perPage = 10): LengthAwarePaginator
    {
        $profile = $user->customerProfile;
        if (! $profile) {
            return $this->emptyPaginator($page, $perPage);
        }

        return $profile->favoriteRestaurants()
            ->with('uploads')
            ->orderByDesc('customer_favorite_restaurants.created_at')
            ->paginate(perPage: $perPage, page: $page);
    }

    public function paginateFavoriteMenuItems(User $user, int $page = 1, int $perPage = 10): LengthAwarePaginator
    {
        $profile = $user->customerProfile;
        if (! $profile) {
            return $this->emptyPaginator($page, $perPage);
        }

        return $profile->favoriteMenuItems()
            ->with(['foodType', 'restaurant:id,name,rating,total_reviews'])
            ->orderByDesc('customer_favorite_menu_items.created_at')
            ->paginate(perPage: $perPage, page: $page);
    }

    protected function emptyPaginator(int $page, int $perPage): LengthAwarePaginator
    {
        return new LengthAwarePaginatorImpl(items: [], total: 0, perPage: $perPage, currentPage: $page);
    }

    protected function requireProfile(User $user): CustomerProfile
    {
        $profile = $user->customerProfile;
        if (! $profile) {
            throw new ModelNotFoundException('Customer profile missing for user '.$user->id);
        }

        return $profile;
    }
}
