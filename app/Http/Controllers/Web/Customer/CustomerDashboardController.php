<?php

namespace App\Http\Controllers\Web\Customer;

use App\Contracts\Customer\CustomerDashboardServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Resources\Customer\CustomerDashboardResource;
use App\Http\Resources\Customer\DashboardRestaurantResource;
use App\Services\Customer\CustomerDashboardService;
use App\Support\PaginationMeta;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The single web home endpoint: renders food items (first 20), the top-picks
 * slider (5) and the first page of restaurants. The restaurants section is the
 * only paginated one — its subsequent pages are fetched from this same URL as
 * JSON (infinite scroll), so the web stays on one endpoint.
 *
 * The mobile app instead hits four granular endpoints (profile / food-types /
 * top-picks / restaurants), all backed by the same service.
 */
class CustomerDashboardController extends Controller
{
    public function __construct(
        protected CustomerDashboardServiceInterface $dashboard,
    ) {
    }

    public function index(Request $request): Response|JsonResponse
    {
        $restaurantsPage = max(1, (int) $request->query('page', 1));
        $foodTypeId = $request->filled('search') ? max(1, (int) $request->query('search')) : null;

        // Infinite scroll: append-only restaurant pages come back as JSON so
        // the page isn't re-rendered and scroll position is preserved.
        if ($request->wantsJson()) {
            $paginator = $this->dashboard->paginateRestaurants(
                $request->user(),
                page: $restaurantsPage,
                perPage: CustomerDashboardService::RESTAURANTS_PER_PAGE,
                foodTypeId: $foodTypeId,
            );

            return response()->json([
                'restaurants' => DashboardRestaurantResource::collection($paginator->getCollection())->resolve($request),
                'pagination' => PaginationMeta::make($paginator),
            ]);
        }

        $data = $this->dashboard->build($request->user(), $restaurantsPage, $foodTypeId);

        return Inertia::render('customer/dashboard', [
            'dashboard' => (new CustomerDashboardResource($data))->resolve($request),
        ]);
    }
}
