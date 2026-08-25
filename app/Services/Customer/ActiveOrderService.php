<?php

namespace App\Services\Customer;

use App\Contracts\Customer\ActiveOrderServiceInterface;
use App\Enums\OrderStatusEnum;
use App\Models\Order;
use App\Models\User;

class ActiveOrderService implements ActiveOrderServiceInterface
{
    public function active(User $user): array
    {
        return Order::query()
            ->where('user_id', $user->id)
            ->whereIn('status', Order::ACTIVE_STATUSES)
            ->with(['restaurant:id,name', 'delivery:id,order_id,status,eta_minutes,distance_miles'])
            ->orderByDesc('placed_at')
            ->get()
            ->map(fn (Order $order) => $this->payload($order))
            ->all();
    }

    /** @return array<string, mixed> */
    private function payload(Order $order): array
    {
        return [
            'id'   => $order->id,
            'uuid' => $order->uuid,
            'status' => $order->status,
            // The customer-facing distinction the bar cares about isn't the
            // exact status, just: has the restaurant acted on it yet? Nothing
            // stamps an eta before that (see RestaurantOrderService::accept()),
            // so a null eta_minutes below already implies this, but we surface
            // it explicitly so the client doesn't have to know the enum.
            'is_accepted' => $order->status !== OrderStatusEnum::PLACED,
            'restaurant_name' => $order->restaurant?->name ?? 'Restaurant',
            'eta_minutes' => $this->remainingEtaMinutes($order),
            'placed_at' => optional($order->placed_at)->toIso8601String(),
        ];
    }

    /**
     * Minutes remaining against the eta stamped at accept-time, counted down
     * as time passes. Null until the restaurant has accepted (no delivery row
     * yet, or no eta_minutes on it) or if we somehow have an eta but no
     * accepted_at to count down from.
     */
    private function remainingEtaMinutes(Order $order): ?int
    {
        $totalEta = $order->delivery?->eta_minutes;
        if ($totalEta === null || $order->accepted_at === null) {
            return null;
        }

        $elapsed = $order->accepted_at->diffInMinutes(now());

        return max(0, $totalEta - $elapsed);
    }
}
