<?php

namespace App\Contracts\Customer;

use App\DTO\Customer\CustomerSearchResults;
use App\Models\User;
use App\Support\Location\LocationContext;
use Illuminate\Support\Collection;

interface CustomerSearchServiceInterface
{
    /**
     * Run a radius-aware search in one of two modes (`$type`):
     *  - `restaurant`: restaurants matched by name OR an offered food type.
     *  - `items`: restaurants with a keyword-matching dish, each carrying up to
     *    3 matching dishes (restaurant-name matches do not qualify here).
     *
     * Both modes paginate restaurants 10/page so the two tabs share the
     * restaurant API's pagination contract.
     *
     * `$filters` carries the post-keyword result chips:
     * `['offers' => bool, 'highest_rated' => bool]`.
     *
     * An empty / whitespace keyword skips the search and returns only the
     * recent-searches list so the same call serves both the empty state and
     * the results state.
     *
     * `$location` selects the discovery coordinates: omit it (web) to derive
     * them from the customer's saved address, or pass an explicit context (API)
     * built from the frontend latitude/longitude.
     */
    public function search(User $user, string $type, string $keyword, int $page = 1, int $perPage = 10, array $filters = [], ?LocationContext $location = null): CustomerSearchResults;

    /**
     * Wipe the customer's search history.
     */
    public function clearHistory(User $user): int;

    /**
     * Recent search keywords for the inline header dropdown — no query is
     * executed, just the history list.
     *
     * @return Collection<int, \App\Models\CustomerSearchHistory>
     */
    public function recentSearches(User $user): Collection;
}
