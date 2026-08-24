<?php

namespace App\Contracts\Driver;

use App\Models\Delivery;
use App\Models\User;

/**
 * Driver-side order status progression: reached_restaurant → picked_up →
 * delivered. picked_up and delivered each require the matching OTP the
 * driver collects on handover (checked against orders.pick_up_code and
 * orders.delivery_code respectively).
 */
interface OrderStatusServiceInterface
{
    /**
     * Advance the order/delivery to the given status. Requires an OTP for
     * picked_up (from the restaurant) and delivered (from the customer).
     */
    public function updateStatus(User $user, int $deliveryId, string $status, ?string $otp): Delivery;
}
