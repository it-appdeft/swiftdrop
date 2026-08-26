<?php

namespace App\Enums;

enum DeliveryStatusEnum: string
{
    case PENDING_ASSIGNMENT = 'pending_assignment';
    case ASSIGNED = 'driver_assigned';
    case REACHED_RESTAURANT = 'reached_restaurant';
    case PICKED_UP = 'picked_up';
    case DELIVERED = 'delivered';
    case FAILED = 'failed';
}
