<?php

namespace App\Http\Controllers\Api\Customer;

use App\Contracts\Customer\CustomerDashboardServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Resources\Customer\DashboardRestaurantResource;
use App\Http\Resources\Customer\FoodTypeResource;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The mobile home screen hits four granular endpoints instead of one combined
 * payload: profile (selected address), food-types, top-picks and restaurants
 * (paginated). They all delegate to {@see CustomerDashboardServiceInterface};
 * only the controller + response shape differ per endpoint.
 *
 * - food-types  → first 20, no location check
 * - top-picks   → 5 bookable, near + high-rated restaurants
 * - restaurants → all nearby restaurants, paginated (see CustomerRestaurantController@index)
 */
class CustomerDashboardController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected CustomerDashboardServiceInterface $dashboard,
    ) {
    }

    /** First 20 food items (Explore strip) — no location check. */
    public function foodTypes(Request $request): JsonResponse
    {
        $items = $this->dashboard->foodTypes();

        return $this->success(
            data: FoodTypeResource::collection($items)->resolve($request),
            message: 'Food items retrieved.',
        );
    }

    /** 5 top picks — bookable, near the selected address and highly rated. */
    public function topPicks(Request $request): JsonResponse
    {
        $foodTypeId = $request->filled('search')
            ? max(1, (int) $request->query('search'))
            : null;

        $picks = $this->dashboard->topPicks(
            auth('sanctum')->user(),
            foodTypeId: $foodTypeId,
        );

        return $this->success(
            data: DashboardRestaurantResource::collection($picks)->resolve($request),
            message: 'Top picks retrieved.',
        );
    }
}
