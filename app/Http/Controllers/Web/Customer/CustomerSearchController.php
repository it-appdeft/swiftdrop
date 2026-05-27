<?php

namespace App\Http\Controllers\Web\Customer;

use App\Contracts\Customer\CustomerSearchServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\Search\SearchRequest;
use App\Http\Resources\Customer\CustomerSearchResource;
use Illuminate\Http\JsonResponse;
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

    public function index(SearchRequest $request): Response|JsonResponse
    {
        $page = max(1, (int) $request->query('page', 1));
        $results = $this->search->search($request->user(), $request->keyword(), page: $page);
        $payload = (new CustomerSearchResource($results))->resolve($request);

        // Subsequent restaurant pages are fetched as JSON so the search page
        // can append rows client-side without re-rendering the whole results.
        if ($request->wantsJson()) {
            return response()->json($payload);
        }

        return Inertia::render('customer/search', [
            'results' => $payload,
        ]);
    }

    public function clear(SearchRequest $request): RedirectResponse
    {
        $this->search->clearHistory($request->user());

        return back()->with('status', 'Search history cleared.');
    }

    /**
     * Recent searches for the header's inline search dropdown — JSON so it
     * can be lazy-loaded without an Inertia visit.
     */
    public function history(SearchRequest $request): JsonResponse
    {
        $recent = $this->search->recentSearches($request->user())
            ->map(fn ($row) => [
                'id' => $row->id,
                'keyword' => $row->keyword,
            ])->values()->all();

        return response()->json(['recent' => $recent]);
    }
}
