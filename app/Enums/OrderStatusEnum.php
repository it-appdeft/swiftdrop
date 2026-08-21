<?php

namespace App\Enums;

enum OrderStatusEnum: string
{
    case PLACED = 'placed';
    case ACCEPTED = 'accepted';
    case REJECTED = 'rejected';
    case PREPARING = 'preparing';
    case REACHED_RESTAURANT = 'reached_restaurant';
    case DRIVER_ASSIGNED = 'driver_assigned';
    case READY_FOR_PICKUP = 'ready_for_pickup';
    case OUT_FOR_DELIVERY = 'out_for_delivery';
    case DELIVERED = 'delivered';
    case CANCELLED = 'cancelled';

    public function boardStatus(): string
    {
        return match ($this) {
            self::PLACED => 'new',
            self::ACCEPTED,
            self::PREPARING => 'preparing',
            self::REACHED_RESTAURANT => 'reached_restaurant',
            self::DRIVER_ASSIGNED => 'driver_assigned',
            self::READY_FOR_PICKUP => 'ready',
            self::OUT_FOR_DELIVERY => 'out_for_delivery',
            self::DELIVERED => 'completed',
            self::CANCELLED,
            self::REJECTED => 'cancelled',
        };
    }
}