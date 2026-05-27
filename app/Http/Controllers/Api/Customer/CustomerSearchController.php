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
        $results = $this->search->search($request->user(), $request->keyword(), page: $page);

        return $this->success(
            data: new CustomerSearchResource($results),
            message: 'Search completed.',
        );
    }

    public function clear(SearchRequest $request): JsonResponse
    {
        $this->search->clearHistory($request->user());

        return $this->success(message: 'Search history cleared.');
    }
}
