<?php

namespace App\Http\Controllers\Api\Customer;

use App\Contracts\Customer\CustomerDashboardServiceInterface;
use App\Contracts\Customer\CustomerRestaurantServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\Search\SearchRequest;
use App\Http\Resources\Customer\CustomerRestaurantResource;
use App\Http\Resources\Customer\DashboardRestaurantResource;
use App\Services\Customer\CustomerDashboardService;
use App\Services\Customer\CustomerRestaurantService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerRestaurantController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected CustomerRestaurantServiceInterface $restaurants,
        protected CustomerDashboardServiceInterface $dashboard,
    ) {
    }

    /**
     * Paginated restaurants list (10 per page by default). Same source as the
     * web "View all" page so both surfaces see identical rows.
     */
    public function index(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query('page', 1));
        $paginator = $this->dashboard->paginateRestaurants(
            $request->user(),
            page: $page,
            perPage: CustomerDashboardService::RESTAURANTS_PER_PAGE,
        );

        return $this->success(
            data: [
                'restaurants' => DashboardRestaurantResource::collection($paginator->getCollection())->resolve($request),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                ],
            ],
            message: 'Restaurants retrieved.',
        );
    }

    public function show(SearchRequest $request, int $id): JsonResponse
    {
        $menuPage = max(1, (int) $request->query('page', 1));
        $data = $this->restaurants->show(
            $request->user(),
            $id,
            $request->keyword(),
            menuPage: $menuPage,
            menuPerPage: CustomerRestaurantService::MENU_PER_PAGE,
        );

        return $this->success(
            data: new CustomerRestaurantResource($data),
            message: 'Restaurant retrieved.',
        );
    }
}
