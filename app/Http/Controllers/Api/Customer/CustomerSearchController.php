<?php

namespace App\Http\Controllers\Api\Customer;

use App\Contracts\Customer\CustomerSearchServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\Search\SearchRequest;
use App\Http\Resources\Customer\CustomerSearchResource;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class CustomerSearchController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected CustomerSearchServiceInterface $search,
    ) {
    }

    public function index(SearchRequest $request): JsonResponse
    {
        $page = max(1, (int) $request->query('page', 1));
        $results = $this->search->search($request->user(), $request->keyword(), page: $page, filters: $request->filters());

        return $this->success(
            data: new CustomerSearchResource($results),
            message: 'Search completed.',
        );
    }

    /**
     * Recent search keywords for the mobile app's search screen — the list a
     * client renders before offering "Clear" ({@see clear()}).
     */
    public function history(SearchRequest $request): JsonResponse
    {
        $recent = $this->search->recentSearches($request->user())
            ->map(fn ($row) => [
                'id' => $row->id,
                'keyword' => $row->keyword,
            ])->values()->all();

        return $this->success(
            data: ['recent' => $recent],
            message: 'Recent searches retrieved.',
        );
    }

    public function clear(SearchRequest $request): JsonResponse
    {
        $this->search->clearHistory($request->user());

        return $this->success(message: 'Search history cleared.');
    }
}
