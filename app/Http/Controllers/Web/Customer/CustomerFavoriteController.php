<?php

namespace App\Http\Controllers\Web\Customer;

use App\Contracts\Customer\CustomerFavoriteServiceInterface;
use App\Http\Controllers\Controller;
use App\Support\PaginationMeta;
use App\Traits\FormatsFavorites;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Customer favourites. Two-way pivot (restaurants + menu items). Everything is
 * JSON: the toggles flip a heart optimistically, and the list endpoints back
 * the profile page's Favorites tab (paginated, infinite scroll) — neither needs
 * a full Inertia page reload.
 *
 * @see \App\Http\Controllers\Api\Customer\CustomerFavoriteController API twin
 */
class CustomerFavoriteController extends Controller
{
    use FormatsFavorites;

    /** Default page size for the favourites lists. */
    protected const PER_PAGE = 10;

    public function __construct(
        protected CustomerFavoriteServiceInterface $favorites,
    ) {
    }

    public function restaurants(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query('page', 1));
        $paginator = $this->favorites->paginateFavoriteRestaurants($request->user(), $page, self::PER_PAGE);

        return response()->json([
            'data' => $this->favoriteRestaurantRows($paginator->getCollection()),
            'pagination' => PaginationMeta::make($paginator),
        ]);
    }

    public function menuItems(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query('page', 1));
        $paginator = $this->favorites->paginateFavoriteMenuItems($request->user(), $page, self::PER_PAGE);

        return response()->json([
            'data' => $this->favoriteMenuItemRows($paginator->getCollection()),
            'pagination' => PaginationMeta::make($paginator),
        ]);
    }

    public function toggleRestaurant(Request $request, int $restaurantId): JsonResponse
    {
        $favorited = $this->favorites->toggleRestaurant($request->user(), $restaurantId);

        return response()->json([
            'favorited' => $favorited,
            'restaurant_id' => $restaurantId,
        ]);
    }

    public function toggleMenuItem(Request $request, int $menuItemId): JsonResponse
    {
        $favorited = $this->favorites->toggleMenuItem($request->user(), $menuItemId);

        return response()->json([
            'favorited' => $favorited,
            'menu_item_id' => $menuItemId,
        ]);
    }
}
