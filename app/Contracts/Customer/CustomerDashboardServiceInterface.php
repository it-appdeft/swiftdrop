<?php

namespace App\Contracts\Customer;

use App\DTO\Customer\CustomerDashboardData;
use App\Models\CustomerAddress;
use App\Models\User;
use App\Support\Location\LocationContext;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface CustomerDashboardServiceInterface
{
    /**
     * Build the combined home payload for the web (single endpoint): first-20
     * food items (no location check), 5 top picks, and the paginated
     * restaurants list. Only restaurants paginate.
     *
     * When `$foodTypeId` is provided the restaurants list is filtered to those
     * offering at least one available dish tagged with that food type.
     */
    public function build(
        ?User $user,
        int $restaurantsPage = 1,
        ?int $foodTypeId = null,
    ): CustomerDashboardData;

    /** The customer's active delivery address (selected → default → newest). */
    public function selectedAddress(?User $user): ?CustomerAddress;

    /**
     * First N food items for the Explore strip — no location check.
     *
     * @return Collection<int, \App\Models\FoodType>
     */
    public function foodTypes(int $limit = 20): Collection;

    /**
     * Top picks: bookable, near + high-rated restaurants (rows carry
     * `restaurant`, `distance_miles`, `is_favorited`). When `$foodTypeId` is
     * provided the list is narrowed to restaurants offering at least one
     * available dish tagged with that food type.
     *
     * `$location` selects the discovery coordinates: omit it (web) to derive
     * them from the customer's saved address, or pass an explicit context (API)
     * built from the frontend latitude/longitude.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function topPicks(?User $user, int $limit = 5, ?int $foodTypeId = null, ?LocationContext $location = null): Collection;

    /**
     * Paginated restaurants near the resolved location (the only paginated
     * section). Each row carries a per-customer `is_favorited` flag; optionally
     * filtered to restaurants offering a specific food type.
     *
     * `$location` selects the discovery coordinates: omit it (web) to derive
     * them from the customer's saved address, or pass an explicit context (API)
     * built from the frontend latitude/longitude.
     */
    public function paginateRestaurants(
        ?User $user,
        int $page = 1,
        int $perPage = 10,
        ?int $foodTypeId = null,
        string $pageName = 'page',
        ?LocationContext $location = null,
    ): LengthAwarePaginator;
}
