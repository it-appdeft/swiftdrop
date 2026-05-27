<?php

namespace App\Http\Controllers\Web\Customer;

use App\Contracts\Customer\CustomerFavoriteServiceInterface;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Customer favourites. Two-way pivot (restaurants + menu items). Toggles are
 * JSON because the customer surface flips a heart icon optimistically — no
 * Inertia page reload required.
 *
 * @see \App\Http\Controllers\Api\Customer\CustomerFavoriteController API twin
 */
class CustomerFavoriteController extends Controller
{
    public function __construct(
        protected CustomerFavoriteServiceInterface $favorites,
    ) {
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
