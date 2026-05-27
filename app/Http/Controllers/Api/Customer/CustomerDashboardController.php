<?php

namespace App\Http\Controllers\Api\Customer;

use App\Contracts\Customer\CustomerDashboardServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Resources\Customer\CustomerDashboardResource;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerDashboardController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected CustomerDashboardServiceInterface $dashboard,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $user = auth('sanctum')->user();
        $restaurantsPage = max(1, (int) $request->query('restaurants_page', 1));
        $foodItemsPage = max(1, (int) $request->query('food_items_page', 1));
        $foodItemId = $request->filled('food_item_id') ? max(1, (int) $request->query('food_item_id')) : null;

        $data = $this->dashboard->build($user, $restaurantsPage, $foodItemsPage, $foodItemId);

        return $this->success(
            data: new CustomerDashboardResource($data),
            message: 'Dashboard retrieved.',
        );
    }
}
