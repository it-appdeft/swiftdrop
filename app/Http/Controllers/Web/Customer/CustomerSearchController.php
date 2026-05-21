<?php

namespace App\Http\Controllers\Web\Customer;

use App\Contracts\Customer\CustomerSearchServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\Search\SearchRequest;
use App\Http\Resources\Customer\CustomerSearchResource;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Web counterpart of {@see \App\Http\Controllers\Api\Customer\CustomerSearchController}.
 * Reuses the same service, request, DTO and resource — only the response
 * layer differs.
 */
class CustomerSearchController extends Controller
{
    public function __construct(
        protected CustomerSearchServiceInterface $search,
    ) {
    }

    public function index(SearchRequest $request): Response
    {
        $results = $this->search->search($request->user(), $request->keyword());

        return Inertia::render('customer/search', [
            'results' => (new CustomerSearchResource($results))->resolve($request),
        ]);
    }

    public function clear(SearchRequest $request): RedirectResponse
    {
        $this->search->clearHistory($request->user());

        return back()->with('status', 'Search history cleared.');
    }
}
