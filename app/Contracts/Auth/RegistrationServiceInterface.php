<?php

namespace App\Contracts\Auth;

use App\Models\User;

interface RegistrationServiceInterface
{
    public function register(array $data, string $type): User;

    public function registerRestaurant(array $data): User;
}
