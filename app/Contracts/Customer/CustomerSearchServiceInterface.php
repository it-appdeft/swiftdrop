<?php

namespace App\Contracts\Customer;

use App\DTO\Customer\CustomerSearchResults;
use App\Models\User;
use Illuminate\Support\Collection;

interface CustomerSearchServiceInterface
{
    /**
     * Run a radius-aware search across restaurants and menu items. Restaurants
     * are paginated (10/page by default) so the results page supports infinite
     * scroll; dishes_by_restaurant remains a capped grouped list.
     *
     * `$filters` carries the post-keyword result chips:
     * `['offers' => bool, 'highest_rated' => bool]`.
     *
     * An empty / whitespace keyword skips the search and returns only the
     * recent-searches list so the same call serves both the empty state and
     * the results state.
     */
    public function search(User $user, string $keyword, int $page = 1, int $perPage = 10, array $filters = []): CustomerSearchResults;

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
