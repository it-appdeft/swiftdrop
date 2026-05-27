<?php

namespace App\Contracts\Customer;

use App\DTO\Customer\CustomerDashboardData;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface CustomerDashboardServiceInterface
{
    /**
     * Build the dashboard payload (food items, restaurants near the user's
     * default address, or a fallback list when no address is on file). Both
     * lists are paginated and the page indices can be advanced independently.
     *
     * When `$foodItemId` is provided the restaurants list is filtered to those
     * offering at least one available dish tagged with that food type — the
     * food_items strip itself stays unfiltered so the customer can switch.
     */
    public function build(
        ?User $user,
        int $restaurantsPage = 1,
        int $foodItemsPage = 1,
        ?int $foodItemId = null,
    ): CustomerDashboardData;

    /**
     * Paginated restaurants list — same source the home screen renders, but
     * pageable for the /customer/restaurants index ("View all" / infinite
     * scroll). Each row carries a per-customer `is_favorited` flag.
     *
     * Optionally filtered to restaurants offering a specific food item.
     */
    public function paginateRestaurants(
        ?User $user,
        int $page = 1,
        int $perPage = 10,
        ?int $foodItemId = null,
    ): LengthAwarePaginator;
}
