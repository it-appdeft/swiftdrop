<?php

namespace App\Http\Controllers\Web\Customer;

use App\Contracts\Customer\CustomerCartServiceInterface;
use App\Contracts\Customer\CustomerDashboardServiceInterface;
use App\Contracts\Customer\CustomerRestaurantServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\Search\SearchRequest;
use App\Http\Resources\Customer\CustomerCartResource;
use App\Http\Resources\Customer\CustomerRestaurantResource;
use App\Http\Resources\Customer\DashboardRestaurantResource;
use App\Services\Customer\CustomerDashboardService;
use App\Services\Customer\CustomerRestaurantService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Web counterpart of {@see \App\Http\Controllers\Api\Customer\CustomerRestaurantController}.
 * Reuses the same service, request and resource — only the response layer
 * differs (Inertia render vs. JSON envelope).
 */
class CustomerRestaurantController extends Controller
{
    public function __construct(
        protected CustomerRestaurantServiceInterface $restaurants,
        protected CustomerCartServiceInterface $cart,
        protected CustomerDashboardServiceInterface $dashboard,
    ) {
    }

    /**
     * Paginated restaurants list — backs the "View all" page on the customer
     * home. Same geo-aware source as the dashboard's first 10 rows; uses
     * Inertia partial reloads so the frontend can append pages via infinite
     * scroll without losing scroll position.
     */
    public function index(Request $request): Response|JsonResponse
    {
        $page = max(1, (int) $request->query('page', 1));
        $paginator = $this->dashboard->paginateRestaurants(
            $request->user(),
            page: $page,
            perPage: CustomerDashboardService::RESTAURANTS_PER_PAGE,
        );

        $payload = [
            'restaurants' => DashboardRestaurantResource::collection($paginator->getCollection())->resolve($request),
            'pagination' => \App\Support\PaginationMeta::make($paginator),
        ];

        // Infinite-scroll subsequent pages are fetched as JSON so they can be
        // appended client-side without re-rendering the whole Inertia page.
        if ($request->wantsJson()) {
            return response()->json($payload);
        }

        return Inertia::render('customer/restaurants/index', $payload);
    }

    public function show(SearchRequest $request, int $id): Response|JsonResponse
    {
        $menuPage = max(1, (int) $request->query('page', 1));
        $data = $this->restaurants->show(
            $request->user(),
            $id,
            $request->keyword(),
            menuPage: $menuPage,
            menuPerPage: CustomerRestaurantService::MENU_PER_PAGE,
            filters: $request->menuFilters(),
        );
        $cart = $this->cart->getCart($request->user());

        $payload = [
            'restaurant' => (new CustomerRestaurantResource($data))->resolve($request),
            // Embedded so the page renders qty steppers + the sticky cart bar
            // without a second request. Refreshed on every cart mutation
            // (which redirects back here).
            'cart' => (new CustomerCartResource($cart))->resolve($request),
        ];

        // Subsequent menu pages are fetched as JSON (infinite scroll) so we
        // can append rows without re-rendering the whole Inertia page.
        if ($request->wantsJson()) {
            return response()->json($payload['restaurant']);
        }

        return Inertia::render('customer/restaurant', $payload);
    }
}
