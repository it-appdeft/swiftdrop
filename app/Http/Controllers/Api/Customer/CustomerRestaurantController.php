<?php

namespace App\Http\Controllers\Api\Customer;

use App\Contracts\Customer\CustomerDashboardServiceInterface;
use App\Contracts\Customer\CustomerRestaurantServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\Discovery\RestaurantDiscoveryRequest;
use App\Http\Requests\Customer\Search\SearchRequest;
use App\Http\Resources\Customer\CustomerRestaurantResource;
use App\Http\Resources\Customer\DashboardRestaurantResource;
use App\Services\Customer\CustomerDashboardService;
use App\Services\Customer\CustomerRestaurantService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class CustomerRestaurantController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected CustomerRestaurantServiceInterface $restaurants,
        protected CustomerDashboardServiceInterface $dashboard,
    ) {
    }

    /**
     * Paginated restaurants list (10 per page by default). Discovery is driven
     * by the frontend-provided latitude/longitude; without a valid pair the
     * list falls back to a global "newest" ordering (null distances) rather
     * than the customer's saved address (which still backs the web surface).
     */
    public function index(RestaurantDiscoveryRequest $request): JsonResponse
    {
        $paginator = $this->dashboard->paginateRestaurants(
            $request->user(),
            page: $request->page(),
            perPage: CustomerDashboardService::RESTAURANTS_PER_PAGE,
            foodTypeId: $request->foodTypeId(),
            location: $request->locationContext(),
        );

        return $this->success(
            data: [
                'restaurants' => DashboardRestaurantResource::collection($paginator->getCollection())->resolve($request),
                'pagination' => \App\Support\PaginationMeta::make($paginator),
            ],
            message: 'Restaurants retrieved.',
        );
    }

    public function show(SearchRequest $request, int $id): JsonResponse
    {
        $data = $this->restaurants->show(
            $request->user(),
            $id,
            $request->keyword(),
            filters: $request->menuFilters(),
        );

        return $this->success(
            data: new CustomerRestaurantResource($data),
            message: 'Restaurant retrieved.',
        );
    }
}
