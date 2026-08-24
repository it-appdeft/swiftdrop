<?php

namespace App\Services\Restaurant;

use App\Contracts\Order\OrderStatusTransitionServiceInterface;
use App\Contracts\Restaurant\RestaurantOrderServiceInterface;
use App\Enums\OrderStatusEnum;
use App\Exceptions\InvalidInputException;
use App\Exceptions\ResourceNotFoundException;
use App\Models\CustomerAddress;
use App\Models\Order;
use App\Models\Restaurant;
use App\Services\Platform\PlatformConfigService;
use Illuminate\Support\Facades\DB;

class RestaurantOrderService implements RestaurantOrderServiceInterface
{
    public function __construct(
        protected PlatformConfigService $config,
        protected OrderStatusTransitionServiceInterface $transitions,
    ) {
    }

    public function accept(Restaurant $restaurant, string $uuid): Order
    {
        return DB::transaction(function () use ($restaurant, $uuid) {
            $order = $this->ownedPlacedOrder($restaurant, $uuid, 'accepted');

            $this->transitions->transition(
                $order,
                OrderStatusEnum::ACCEPTED,
                $restaurant->user_id,
                ['accepted_at' => now()],
            );

            // Opens the order up for driver assignment: DriverDashboardService::
            // pendingDeliveries() only surfaces `pending_assignment` deliveries
            // to online drivers within the configured radius of the restaurant.
            // The distance/eta computed here is also what the customer's active-
            // order bar shows (ActiveOrderService) — it only appears once this
            // row exists, i.e. only once the restaurant has accepted.
            // firstOrCreate guards a duplicate on any retry/replay.
            [$distanceMiles, $etaMinutes] = $this->estimateDelivery($restaurant, $order->address);
            $order->delivery()->firstOrCreate([], [
                'status' => 'pending_assignment',
                'distance_miles' => $distanceMiles,
                'eta_minutes' => $etaMinutes,
            ]);

            return $order;
        });
    }

    public function reject(Restaurant $restaurant, string $uuid, ?string $reason = null): Order
    {
        return DB::transaction(function () use ($restaurant, $uuid, $reason) {
            $order = $this->ownedPlacedOrder($restaurant, $uuid, 'rejected');

            $this->transitions->transition(
                $order,
                OrderStatusEnum::REJECTED,
                $restaurant->user_id,
                [
                    'cancelled_by' => 'restaurant',
                    'cancellation_reason' => $reason,
                    'cancelled_at' => now(),
                ],
            );

            return $order;
        });
    }

    public function updateStatus(Restaurant $restaurant, string $uuid, string $status): Order
    {
        return DB::transaction(function () use ($restaurant, $uuid, $status) {
            $order = $this->ownedOrder($restaurant, $uuid);

            $orderFields = match ($status) {
                'preparing' => ['preparing_at' => now()],
                'ready_for_pickup' => ['ready_at' => now()],
                default => [],
            };

            $this->transitions->transition($order, OrderStatusEnum::from($status), $restaurant->user_id, $orderFields);

            return $order;
        });
    }

    // ─── Internals ──────────────────────────────────────────────────────────

    /**
     * Estimated total delivery time (kitchen prep + restaurant→customer
     * travel) and the distance it's based on. Distance is null when either
     * point is missing (no saved coordinates) — the eta then falls back to
     * prep time alone, same as the delivery-request pool showing "—" for an
     * unknown distance.
     *
     * @return array{0: ?float, 1: int}
     */
    private function estimateDelivery(Restaurant $restaurant, ?CustomerAddress $address): array
    {
        $distanceMiles = ($address && $address->lat !== null && $address->lng !== null)
            ? $restaurant->distanceMilesFrom((float) $address->lat, (float) $address->lng)
            : null;

        $prepMinutes = $restaurant->deliverySettings?->estimated_prep_time_min
            ?? $restaurant->serviceSettings?->avg_prep_time_min
            ?? $this->config->int(PlatformConfigService::KEY_DEFAULT_PREP_TIME_MINUTES, 20);

        $speedMph = max(1.0, $this->config->float(PlatformConfigService::KEY_DRIVER_AVERAGE_SPEED_MPH, 18.0));
        $travelMinutes = $distanceMiles !== null ? (int) ceil($distanceMiles / $speedMph * 60) : 0;

        return [$distanceMiles, $prepMinutes + $travelMinutes];
    }

    /** The restaurant's own order, still sitting unactioned at `placed`. */
    private function ownedPlacedOrder(Restaurant $restaurant, string $uuid, string $action): Order
    {
        $order = $this->ownedOrder($restaurant, $uuid);

        if ($order->status !== OrderStatusEnum::PLACED) {
            throw InvalidInputException::make("This order can no longer be {$action}.", 'status');
        }

        return $order;
    }

    /** The restaurant's own order, regardless of its current status. */
    private function ownedOrder(Restaurant $restaurant, string $uuid): Order
    {
        $order = Order::query()
            ->where('uuid', $uuid)
            ->where('restaurant_id', $restaurant->id)
            ->with('address')
            ->lockForUpdate()
            ->first();

        if (! $order) {
            throw ResourceNotFoundException::for('Order', 'order');
        }

        return $order;
    }
}
