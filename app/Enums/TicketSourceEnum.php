<?php

namespace App\Enums;

enum TicketSourceEnum: string
{
    case CUSTOMER = 'customer';
    case DRIVER = 'driver';
    case RESTAURANT = 'restaurant';

    public function label(): string
    {
        return match ($this) {
            self::CUSTOMER => 'Customer',
            self::DRIVER => 'Driver',
            self::RESTAURANT => 'Restaurant',
        };
    }
}
