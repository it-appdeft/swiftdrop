<?php

namespace App\Http\Resources\Driver;

use App\Enums\OrderStatusEnum;
use App\Models\Delivery;
use App\Models\DriverEarning;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One completed delivery on the driver's history tab: the restaurant, how
 * long it took (driver_assigned → delivered) and the payout.
 *
 * @property Delivery $resource
 */
class DeliveryHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $delivery = $this->resource;
        $order = $delivery->order;
        $restaurant = $order?->restaurant;

        $assignedAt = $order?->statusHistories
            ->firstWhere('status', OrderStatusEnum::DRIVER_ASSIGNED)
            ?->created_at;

        $earning = $delivery->earnings->firstWhere('type', DriverEarning::TYPE_DELIVERY_FEE);
        $maxPrepTime = $delivery->order->items->max(fn ($item) => $item->menuItem?->prep_time ?? 0);

        return [
            'delivery_id' => $delivery->id,
            'order_uuid' => $order?->uuid,
            // Same short reference shown on the incoming-offer card.
            'reference' => $order ? '#CON-'.str_pad((string) $order->id, 4, '0', STR_PAD_LEFT) : null,
            'restaurant' => $restaurant ? [
                'name' => $restaurant->name,
                'image' => $restaurant->banner_url ?? $restaurant->logo_url,
            ] : null,
            'preparation_time' => $maxPrepTime,
            'distance_miles' => $delivery->distance_miles !== null ? (float) $delivery->distance_miles : null,
            'duration_minutes' => ($assignedAt && $delivery->delivered_at)
                ? (int) round($assignedAt->diffInMinutes($delivery->delivered_at))
                : null,
            'amount' => $earning ? (float) $earning->amount : null,
            'currency' => 'GBP',
            'delivered_at' => optional($delivery->delivered_at)->toIso8601String(),
        ];
    }
}
