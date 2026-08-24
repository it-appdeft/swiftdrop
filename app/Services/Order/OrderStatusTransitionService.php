<?php

namespace App\Services\Order;

use App\Contracts\Order\OrderStatusTransitionServiceInterface;
use App\Enums\OrderStatusEnum;
use App\Exceptions\InvalidInputException;
use App\Models\Order;

class OrderStatusTransitionService implements OrderStatusTransitionServiceInterface
{
    /**
     * The order status(es) a transition is allowed to move on from, keyed by
     * the target status value.
     *
     * @var array<string, array<OrderStatusEnum>>
     */
    private const ALLOWED_FROM = [
        // Restaurant portal.
        'accepted' => [OrderStatusEnum::PLACED],
        'rejected' => [OrderStatusEnum::PLACED],
        'preparing' => [OrderStatusEnum::ACCEPTED],
        'ready_for_pickup' => [OrderStatusEnum::PREPARING],

        // Driver app. A driver can be assigned as soon as the restaurant has
        // accepted — kitchen prep and driver assignment run in parallel, the
        // driver doesn't wait on ready_for_pickup to start heading over.
        'driver_assigned' => [OrderStatusEnum::ACCEPTED, OrderStatusEnum::PREPARING, OrderStatusEnum::READY_FOR_PICKUP],
        'reached_restaurant' => [OrderStatusEnum::DRIVER_ASSIGNED],
        'picked_up' => [OrderStatusEnum::REACHED_RESTAURANT],

        // System-triggered only (see AutoAdvanceOrderToOutForDeliveryJob) —
        // not exposed as a manual action to either the restaurant or the
        // driver.
        'out_for_delivery' => [OrderStatusEnum::PICKED_UP],

        // Usually follows the auto-advance above, but a driver confirming
        // delivery inside that window is still valid straight off pickup.
        'delivered' => [OrderStatusEnum::PICKED_UP, OrderStatusEnum::OUT_FOR_DELIVERY],
    ];

    /**
     * Overall progress order, used only to detect the one case where the
     * driver track has legitimately overtaken the kitchen track (see
     * transition()'s catch-up branch below) — not used to gate anything
     * else, which still goes through the exact ALLOWED_FROM predecessor.
     *
     * @var array<string, int>
     */
    private const RANK = [
        'placed' => 0,
        'accepted' => 1,
        'preparing' => 2,
        'ready_for_pickup' => 3,
        'driver_assigned' => 4,
        'reached_restaurant' => 5,
        'picked_up' => 6,
        'out_for_delivery' => 7,
        'delivered' => 8,
    ];

    /** The two restaurant milestones that can legitimately arrive "late". */
    private const CATCH_UP_ELIGIBLE = ['preparing', 'ready_for_pickup'];

    public function transition(Order $order, OrderStatusEnum $to, ?int $updatedByUserId, array $orderFields = []): Order
    {
        // Idempotent no-op — a retried request lands on the status it already achieved.
        if ($order->status === $to) {
            return $order;
        }

        $allowedFrom = self::ALLOWED_FROM[$to->value] ?? null;

        if ($allowedFrom !== null && in_array($order->status, $allowedFrom, true)) {
            $order->forceFill(array_merge($orderFields, ['status' => $to]))->save();
            $order->statusHistories()->create(['status' => $to, 'updated_by' => $updatedByUserId]);

            return $order;
        }

        // The driver can be assigned (and can even reach the restaurant)
        // before the restaurant has clicked through preparing/ready_for_pickup
        // — driver assignment and kitchen prep run in parallel. When that
        // happens, the kitchen's own milestones would otherwise fail the
        // predecessor check above because `status` has already moved past
        // them. Record the milestone (history + its own orderFields, e.g.
        // preparing_at/ready_at) without regressing `status` back down.
        if (
            in_array($to->value, self::CATCH_UP_ELIGIBLE, true)
            && (self::RANK[$order->status->value] ?? -1) > (self::RANK[$to->value] ?? PHP_INT_MAX)
        ) {
            if (! empty($orderFields)) {
                $order->forceFill($orderFields)->save();
            }
            $order->statusHistories()->create(['status' => $to, 'updated_by' => $updatedByUserId]);

            return $order;
        }

        throw InvalidInputException::make(
            "Order cannot be marked {$to->value} from its current status.",
            'status',
        );
    }
}
