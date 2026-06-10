<?php

namespace App\Services\Customer;

use App\Contracts\Customer\CustomerFavoriteServiceInterface;
use App\Contracts\Customer\CustomerRestaurantServiceInterface;
use App\DTO\Customer\CustomerRestaurantData;
use App\Models\MenuItem;
use App\Models\Restaurant;
use App\Models\Cart;
use App\Models\User;
use App\Support\PaginationMeta;
use Illuminate\Support\Collection;

class CustomerRestaurantService implements CustomerRestaurantServiceInterface
{
    public function __construct(
        protected CustomerFavoriteServiceInterface $favorites,
    ) {
    }

    public function show(
        User $user,
        int $restaurantId,
        string $keyword = '',
        array $filters = [],
    ): CustomerRestaurantData {
        // Customers may only open live, approved restaurants — anything else 404s.
        $restaurant = Restaurant::query()
            ->active()
            ->approved()
            ->with(['hours', 'uploads'])
            ->findOrFail($restaurantId);

        $cart = Cart::query()
            ->where('user_id', $user->id)
            ->where('restaurant_id', $restaurant->id)
            ->with([
                'items.modifiers',
            ])
            ->first();

        $cartLookup = $cart
            ? $cart->items->keyBy('menu_item_id')->all()
            : [];

        // Normalise the customer-facing menu filters (Veg / Non-Veg + Ratings 4.0+).
        $filters = [
            'diet' => in_array($filters['diet'] ?? null, ['veg', 'non_veg'], true) ? $filters['diet'] : null,
            'min_rating' => isset($filters['min_rating']) && (float) $filters['min_rating'] > 0
                ? (float) $filters['min_rating']
                : null,
        ];

        // Full menu — same partner sort order, narrowed by the diet/rating
        // filters. Unavailable dishes are kept (the frontend grays them out, no
        // Add button) but sorted after available ones within each category.
        $menuItems = MenuItem::query()
            ->forRestaurant($restaurant->id)
            ->customerFilter($filters)
            ->with([
                'foodType',
                'category',
                'modifierGroups.options',
                'uploads' => fn ($q) => $q->where('collection', 'image'),
            ])
            ->orderByDesc('is_available')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        $categories = $menuItems
            ->groupBy(fn ($item) => $item->category_id ?? 0);

        // Recommended list: the same menu narrowed to what the customer searched
        // for (e.g. "pizza"). Empty keyword → nothing recommended. Not paginated
        // — usually a short, derived list that's rendered alongside the menu.
        // The same filters apply so it stays consistent with the main list.
        $keyword = trim($keyword);
        $recommended = $keyword === ''
            ? new Collection()
            : MenuItem::query()
                ->forRestaurant($restaurant->id)
                ->matchingKeyword($keyword)
                ->customerFilter($filters)
                ->with([
                    'foodType',
                    'category',
                    'modifierGroups.options',
                    'uploads' => fn ($q) => $q->where('collection', 'image'),
                ])
                ->orderByDesc('is_available')
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get();

        $favoriteRestaurantIds = $this->favorites->favoriteRestaurantIds($user);
        $favoriteMenuItemIds = $this->favorites->favoriteMenuItemIds($user);

        return new CustomerRestaurantData(
            restaurant: $restaurant,
            menuCategories: $categories,
            recommended: $recommended,
            keyword: $keyword,
            isFavorite: in_array($restaurant->id, $favoriteRestaurantIds, true),
            favoriteMenuItemIds: $favoriteMenuItemIds,
            cartLookup: $cartLookup,
            filters: $filters,
        );
    }
}
