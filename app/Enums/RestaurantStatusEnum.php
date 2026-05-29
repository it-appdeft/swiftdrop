<?php

namespace App\Enums;

enum RestaurantStatusEnum: string
{
    case PENDING_APPROVAL = 'pending_approval';
    case ACTIVE = 'active';
    case INACTIVE = 'inactive';
    case SUSPENDED = 'suspended';
}
