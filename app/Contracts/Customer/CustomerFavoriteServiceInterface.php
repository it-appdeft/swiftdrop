<?php

namespace App\Contracts\Customer;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Saved-favourites bookkeeping for customers: restaurants and individual menu
 * items. Toggle returns the new state so the UI can flip the heart icon
 * without a second roundtrip.
 */
interface CustomerFavoriteServiceInterface
{
    /** Toggle a restaurant favourite. Returns true if now favorited, false if removed. */
    public function toggleRestaurant(User $user, int $restaurantId): bool;

    /** Toggle a menu-item favourite. Returns true if now favorited, false if removed. */
    public function toggleMenuItem(User $user, int $menuItemId): bool;

    /** @return array<int, int> restaurant ids the user has favourited */
    public function favoriteRestaurantIds(User $user): array;

    /** @return array<int, int> menu_item ids the user has favourited */
    public function favoriteMenuItemIds(User $user): array;

    /** @return Collection<int, \App\Models\Restaurant> */
    public function favoriteRestaurants(User $user): Collection;

    /** @return Collection<int, \App\Models\MenuItem> */
    public function favoriteMenuItems(User $user): Collection;

    /** Paginated favourites — used by the API list endpoints. */
    public function paginateFavoriteRestaurants(User $user, int $page = 1, int $perPage = 10): LengthAwarePaginator;

    public function paginateFavoriteMenuItems(User $user, int $page = 1, int $perPage = 10): LengthAwarePaginator;
}
