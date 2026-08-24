<?php

namespace App\Contracts\Order;

use App\Enums\OrderStatusEnum;
use App\Models\Order;

/**
 * The single choke point for moving an order's status forward — shared by
 * the restaurant portal (accept/reject, preparing, ready_for_pickup), the
 * driver app (reached_restaurant, picked_up, delivered) and the
 * system-triggered out_for_delivery auto-advance (see
 * AutoAdvanceOrderToOutForDeliveryJob). Every caller funnels through here so
 * the allowed-predecessor rules and the order_status_histories log live in
 * exactly one place.
 *
 * Callers own anything beyond the order row itself: ownership checks,
 * locking, OTP verification, and — driver actions only — mirroring the
 * transition onto deliveries.status.
 */
interface OrderStatusTransitionServiceInterface
{
    /**
     * Move $order to $to. Throws {@see \App\Exceptions\InvalidInputException}
     * if the order's current status isn't an allowed predecessor of $to.
     * Idempotent: re-sending the status the order is already at is a no-op.
     *
     * @param  array<string, mixed>  $orderFields  extra columns to set alongside status (e.g. picked_up_at, cancelled_by)
     * @param  int|null  $updatedByUserId  null for a system-triggered transition (no human actor)
     */
    public function transition(Order $order, OrderStatusEnum $to, ?int $updatedByUserId, array $orderFields = []): Order;
}
