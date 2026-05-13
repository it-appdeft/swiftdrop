<?php

namespace App\Enums;

enum UserRoleEnum: string
{
    case CUSTOMER = 'customer';
    case DRIVER = 'driver';
    case RESTAURANT_OWNER = 'restaurant_owner';
    case ADMIN = 'admin';
}
