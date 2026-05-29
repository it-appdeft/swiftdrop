<?php

namespace App\Contracts\Customer;

use App\DTO\Customer\CustomerDashboardData;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface CustomerDashboardServiceInterface
{
    /**
     * Build the dashboard payload (food items, restaurants near the user's
     * default address, or a fallback list when no address is on file).
     */
    public function build(?User $user): CustomerDashboardData;

    /**
     * Paginated restaurants list — same source the home screen renders, but
     * pageable for the /customer/restaurants index ("View all" / infinite
     * scroll). Each row carries a per-customer `is_favorited` flag.
     */
    public function paginateRestaurants(?User $user, int $page = 1, int $perPage = 10): LengthAwarePaginator;
}
