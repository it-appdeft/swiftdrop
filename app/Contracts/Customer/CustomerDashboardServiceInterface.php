<?php

namespace App\Contracts\Customer;

use App\DTO\Customer\CustomerDashboardData;
use App\Models\User;

interface CustomerDashboardServiceInterface
{
    /**
     * Build the dashboard payload (food items, restaurants near the user's
     * default address, or a fallback list when no address is on file).
     */
    public function build(?User $user): CustomerDashboardData;
}
