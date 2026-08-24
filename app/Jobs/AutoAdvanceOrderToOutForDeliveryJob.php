<?php

namespace App\Jobs;

use App\Contracts\Order\OrderStatusTransitionServiceInterface;
use App\Enums\OrderStatusEnum;
use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Stands in for the restaurant confirming handover: 10 seconds after a
 * driver marks an order picked_up (see OrderStatusService::updateStatus()),
 * this bumps the order to out_for_delivery without any manual restaurant
 * click. No-op if the order has since moved on (e.g. already delivered) or
 * off this track entirely (e.g. cancelled) — it only ever advances from
 * picked_up.
 */
class AutoAdvanceOrderToOutForDeliveryJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public int $backoff = 15;

    public function __construct(
        public readonly int $orderId,
    ) {
    }

    public function handle(OrderStatusTransitionServiceInterface $transitions): void
    {
        $order = Order::find($this->orderId);

        if (! $order || $order->status !== OrderStatusEnum::PICKED_UP) {
            return;
        }

        // System-triggered — no human actor to attribute the history row to.
        $transitions->transition($order, OrderStatusEnum::OUT_FOR_DELIVERY, null);
    }
}
