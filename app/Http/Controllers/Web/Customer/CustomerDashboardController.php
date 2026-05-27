<?php

namespace App\Http\Controllers\Web\Customer;

use App\Contracts\Customer\CustomerDashboardServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Resources\Customer\CustomerDashboardResource;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Web counterpart to {@see \App\Http\Controllers\Api\Customer\CustomerDashboardController}.
 * Both controllers delegate to {@see CustomerDashboardServiceInterface} and reuse
 * the same {@see CustomerDashboardResource}; only the response layer differs
 * (Inertia render vs. JSON envelope).
 */
class CustomerDashboardController extends Controller
{
    public function __construct(
        protected CustomerDashboardServiceInterface $dashboard,
    ) {
    }

    public function index(Request $request): Response
    {
        $restaurantsPage = max(1, (int) $request->query('restaurants_page', 1));
        $foodItemsPage = max(1, (int) $request->query('food_items_page', 1));
        $foodItemId = $request->filled('food_item_id') ? max(1, (int) $request->query('food_item_id')) : null;

        $data = $this->dashboard->build($request->user(), $restaurantsPage, $foodItemsPage, $foodItemId);

        return Inertia::render('customer/dashboard', [
            'dashboard' => (new CustomerDashboardResource($data))->resolve($request),
        ]);
    }
}
