<?php

namespace App\Contracts\Customer;

use App\DTO\Customer\CustomerSearchResults;
use App\Models\User;

interface CustomerSearchServiceInterface
{
    /**
     * Run a radius-aware search across restaurants and menu items.
     * An empty / whitespace keyword skips the search and returns only the
     * recent-searches list so the same call serves both the empty state and
     * the results state.
     */
    public function search(User $user, string $keyword): CustomerSearchResults;

    /**
     * Wipe the customer's search history.
     */
    public function clearHistory(User $user): int;
}
