<?php

namespace App\Http\Controllers\Api\Customer;

use App\Contracts\Customer\CustomerFavoriteServiceInterface;
use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * API twin of {@see \App\Http\Controllers\Web\Customer\CustomerFavoriteController}.
 * Adds listing endpoints so the mobile app can render the customer's saved
 * lists; the web surface uses inline `is_favorited` flags on existing
 * payloads and doesn't need a list call.
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

        $rows = $paginator->getCollection()
            ->map(fn (Restaurant $r) => [
                'id' => $r->id,
                'name' => $r->name,
                'tagline' => $r->tagline,
                'cuisines' => $r->cuisines,
                'city' => $r->city,
                'logo_url' => $r->logo_path ? '/storage/'.ltrim($r->logo_path, '/') : null,
                'cover_url' => $r->cover_photo_path ? '/storage/'.ltrim($r->cover_photo_path, '/') : null,
                'rating' => ((int) $r->total_reviews) > 0 && $r->rating !== null ? (float) $r->rating : null,
                'total_reviews' => (int) $r->total_reviews,
            ])->values()->all();

        return response()->json([
            'data' => $rows,
            'meta' => $this->meta($paginator),
        ]);
    }

    public function menuItems(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query('page', 1));
        $perPage = $this->perPage($request);

        $paginator = $this->favorites->paginateFavoriteMenuItems($request->user(), $page, $perPage);

        $rows = $paginator->getCollection()
            ->map(fn (MenuItem $m) => [
                'id' => $m->id,
                'restaurant_id' => $m->restaurant_id,
                'name' => $m->name,
                'description' => $m->description,
                'price' => (float) $m->price,
                'is_veg' => (bool) $m->is_veg,
                'image_url' => $m->foodItem && $m->foodItem->image
                    ? '/storage/'.ltrim($m->foodItem->image, '/')
                    : null,
            ])->values()->all();

        return response()->json([
            'data' => $rows,
            'meta' => $this->meta($paginator),
        ]);
    }

    /** Clamp the page-size override to the [1, 50] window. */
    protected function perPage(Request $request): int
    {
        $raw = (int) $request->query('per_page', 10);

        return max(1, min(50, $raw));
    }

    /** @return array<string, int> */
    protected function meta(\Illuminate\Contracts\Pagination\LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ];
    }
}
