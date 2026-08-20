<?php

namespace App\Http\Resources\Driver;

use App\Models\Delivery;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One incoming delivery offer as shown on the driver home screen: the payout,
 * ETA/distance, and the pickup (restaurant) + dropoff (customer) legs.
 *
 * @property Delivery $resource
 */
class DeliveryRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $delivery = $this->resource;
        $order = $delivery->order;
        $restaurant = $order?->restaurant;
        $address = $order?->address;

        return [
            'id' => $delivery->id,
            'order_uuid' => $order?->uuid,
            // Short human-facing reference for the card (e.g. "#CON-0042").
            'reference' => $order ? '#CON-'.str_pad((string) $order->id, 4, '0', STR_PAD_LEFT) : null,
            'status' => $delivery->status,
            'amount' => $order ? (float) $order->total : null,
            'currency' => 'GBP',
            'eta_minutes' => $delivery->eta_minutes,
            'distance_miles' => $delivery->distance_miles !== null ? (float) $delivery->distance_miles : null,
            'pickup' => $restaurant ? [
                'name' => $restaurant->name,
                'address' => $restaurant->full_address,
                'lat' => $restaurant->lat !== null ? (float) $restaurant->lat : null,
                'lng' => $restaurant->lng !== null ? (float) $restaurant->lng : null,
            ] : null,
            'dropoff' => $address ? [
                'label' => $address->label,
                'address' => $this->formatAddress($address),
                'instructions' => $address->delivery_instructions,
                'lat' => $address->lat !== null ? (float) $address->lat : null,
                'lng' => $address->lng !== null ? (float) $address->lng : null,
            ] : null,
        ];
    }

    private function formatAddress(\App\Models\CustomerAddress $a): string
    {
        return collect([$a->address_line_1, $a->address_line_2, $a->city, $a->postcode])
            ->filter()
            ->implode(', ');
    }
}
