<?php

namespace App\Http\Controllers\Api\Customer;

use App\Contracts\Customer\CustomerDashboardServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\Discovery\RestaurantDiscoveryRequest;
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

    /**
     * Up to 5 top picks (never paginated) — bookable, highly rated, near the
     * frontend-provided latitude/longitude. Without a valid coordinate pair the
     * list comes back empty: the customer's saved address is never used on the
     * API and there is no global fallback.
     */
    public function topPicks(RestaurantDiscoveryRequest $request): JsonResponse
    {
        $picks = $this->dashboard->topPicks(
            auth('sanctum')->user(),
            foodTypeId: $request->foodTypeId(),
            location: $request->locationContext(),
        );

        return $this->success(
            data: DashboardRestaurantResource::collection($picks)->resolve($request),
            message: 'Top picks retrieved.',
        );
    }
}
