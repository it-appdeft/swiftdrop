<?php

namespace App\Http\Controllers\Api\Customer;

use App\Contracts\Customer\CustomerFavoriteServiceInterface;
use App\Http\Controllers\Controller;
use App\Support\PaginationMeta;
use App\Traits\FormatsFavorites;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * API twin of {@see \App\Http\Controllers\Web\Customer\CustomerFavoriteController}.
 * Both expose the saved restaurant + menu-item lists (paginated, with links);
 * the toggle actions flip a single favourite.
 */
class CustomerFavoriteController extends Controller
{
    use FormatsFavorites;

    public function __construct(
        protected CustomerFavoriteServiceInterface $favorites,
    ) {
    }

    public function toggleRestaurant(Request $request, int $restaurantId): JsonResponse
    {
        $favorited = $this->favorites->toggleRestaurant($request->user(), $restaurantId);

        return response()->json([
            'data' => [
                'favorited' => $favorited,
                'restaurant_id' => $restaurantId,
            ],
        ]);
    }

    public function toggleMenuItem(Request $request, int $menuItemId): JsonResponse
    {
        $favorited = $this->favorites->toggleMenuItem($request->user(), $menuItemId);

        return response()->json([
            'data' => [
                'favorited' => $favorited,
                'menu_item_id' => $menuItemId,
            ],
        ]);
    }

    public function restaurants(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query('page', 1));
        $perPage = $this->perPage($request);

        $paginator = $this->favorites->paginateFavoriteRestaurants($request->user(), $page, $perPage);

        return response()->json([
            'success' => true,
            'message' => 'Favorite restaurants retrieved.',
            'data' => [
                'restaurants' => $this->favoriteRestaurantRows($paginator->getCollection()),
                'pagination' => PaginationMeta::make($paginator),
            ],
        ]);
    }

    public function menuItems(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query('page', 1));
        $perPage = $this->perPage($request);

        $paginator = $this->favorites->paginateFavoriteMenuItems($request->user(), $page, $perPage);

        return response()->json([
            'success' => true,
            'message' => 'Favorite items retrieved.',
            'data' => [
                'menu_items' => $this->favoriteMenuItemRows($paginator->getCollection()),
                'pagination' => PaginationMeta::make($paginator),
            ],
        ]);
    }

    /** Clamp the page-size override to the [1, 50] window. */
    protected function perPage(Request $request): int
    {
        $raw = (int) $request->query('per_page', 10);

        return max(1, min(50, $raw));
    }
}
