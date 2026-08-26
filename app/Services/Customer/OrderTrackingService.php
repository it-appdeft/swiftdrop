<?php

namespace App\Services\Customer;

use App\Contracts\Customer\OrderTrackingServiceInterface;
use App\Enums\OrderStatusEnum;
use App\Exceptions\InvalidInputException;
use App\Exceptions\ResourceNotFoundException;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class OrderTrackingService implements OrderTrackingServiceInterface
{
    public function status(User $user, int $id): array
    {
        return $this->payload($this->ownedOrder($user, $id));
    }

    public function cancel(User $user, int $id, ?string $reason): array
    {
        $order = DB::transaction(function () use ($user, $id, $reason) {
            $order = $this->ownedOrder($user, $id, lockForUpdate: true);

            if (! $order->isCancellable()) {
                throw InvalidInputException::make('This order can no longer be cancelled.', 'status');
            }

            $order->update([
                'status' => OrderStatusEnum::CANCELLED,
                'cancelled_by' => 'customer',
                'cancellation_reason' => $reason,
                'cancelled_at' => now(),
            ]);

            $order->statusHistories()->create([
                'status' => OrderStatusEnum::CANCELLED,
                'updated_by' => $user->id,
            ]);

            return $order;
        });

        return $this->payload($order->fresh([
            'restaurant', 'address', 'items.modifiers', 'payment', 'delivery.driver.user', 'statusHistories',
        ]));
    }

    // ─── Internals ──────────────────────────────────────────────────────────

    private function ownedOrder(User $user, int $id, bool $lockForUpdate = false): Order
    {
        $query = Order::query()
            ->where('id', $id)
            ->where('user_id', $user->id)
            ->with(['restaurant', 'address', 'items.modifiers', 'payment', 'delivery.driver.user', 'statusHistories']);

        if ($lockForUpdate) {
            $query->lockForUpdate();
        }

        $order = $query->first();

        if (! $order) {
            throw ResourceNotFoundException::for('Order', 'order');
        }

        return $order;
    }

    /** @return array<string, mixed> */
    private function payload(Order $order): array
    {
        $restaurant = $order->restaurant;
        $address = $order->address;
        $delivery = $order->delivery;

        return [
            'order' => [
                'id' => $order->id,
                'uuid' => $order->uuid,
                'status' => $order->status,
                'cancellable' => $order->isCancellable(),
                'delivery_code' => $order->delivery_code,
                'cancellation_reason' => $order->cancellation_reason,
                'subtotal' => (float) $order->subtotal,
                'delivery_fee' => (float) $order->delivery_fee,
                'discount_amount' => (float) $order->discount_amount,
                'vat_amount' => (float) $order->vat_amount,
                'total' => (float) $order->total,
                'special_instructions' => $order->special_instructions,
                'placed_at' => optional($order->placed_at)->toIso8601String(),
            ],
            'restaurant' => $restaurant ? [
                'id' => $restaurant->id,
                'name' => $restaurant->name,
                'location' => $restaurant->city ?? $restaurant->full_address,
                'image' => $restaurant->banner_url ?? $restaurant->logo_url,
                'lat' => $restaurant->lat !== null ? (float) $restaurant->lat : null,
                'lng' => $restaurant->lng !== null ? (float) $restaurant->lng : null,
            ] : null,
            'address' => $address ? [
                'label' => $address->label,
                'line' => collect([
                    $address->address_line_1, $address->address_line_2, $address->city, $address->postcode,
                ])->filter()->implode(', '),
                'lat' => $address->lat !== null ? (float) $address->lat : null,
                'lng' => $address->lng !== null ? (float) $address->lng : null,
            ] : null,
            'items' => $order->items->map(fn ($item) => [
                'name' => $item->name,
                'quantity' => (int) $item->quantity,
                'unit_price' => (float) $item->unit_price,
                'subtotal' => (float) $item->subtotal,
                'modifiers' => $item->modifiers->map(fn ($m) => $m->option_name)->all(),
            ])->all(),
            'payment' => $order->payment ? [
                'method' => $order->payment->method,
                'status' => $order->payment->status,
            ] : null,
            'delivery' => $delivery ? [
                'status' => $delivery->status,
                'eta_minutes' => $delivery->eta_minutes,
                'driver' => $delivery->driver ? [
                    'name' => trim($delivery->driver->first_name.' '.$delivery->driver->last_name),
                    'photo' => $delivery->driver->profile_photo,
                ] : null,
            ] : null,
            'status_history' => $order->statusHistories
                ->sortBy('created_at')
                ->map(fn ($h) => [
                    'status' => $h->status,
                    'at' => optional($h->created_at)->toIso8601String(),
                ])->values()->all(),
        ];
    }
}
