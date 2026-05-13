<?php

namespace App\Contracts\Auth;

use App\Models\User;

interface RegistrationServiceInterface
{
    public function registerCustomer(array $data): User;

    public function registerRestaurant(array $data): User;
}
