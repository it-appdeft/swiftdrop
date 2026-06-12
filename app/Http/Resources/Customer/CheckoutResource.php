<?php

namespace App\Http\Resources\Customer;

use App\DTO\Customer\CheckoutData;
use App\DTO\Customer\CustomerCartData;
use App\Models\CustomerAddress;
use App\Models\Offer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Checkout payload shared by the web (Inertia) and API controllers. Reuses
 * {@see CustomerCartResource} for the line-item shape, then layers on the
 * address picker, delivery-range state, coupon state and the computed bill.
 *
 * @property CheckoutData $resource
 */
class CheckoutResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var CheckoutData $data */
        $data = $this->resource;

        $cartPayload = (new CustomerCartResource(new CustomerCartData($data->cart)))->resolve($request);

        return [
            'is_empty' => $data->isEmpty(),
            'restaurant' => $data->restaurant ? [
                'id' => $data->restaurant->id,
                'name' => $data->restaurant->name,
                'area' => $data->restaurant->city ?? $data->restaurant->full_address,
                'logo_url' => $cartPayload['restaurant']['logo_url'] ?? null,
                // Orderable-now state — checkout blocks payment (and the
                // frontend warns) when the restaurant is paused/suspended or
                // outside its operating hours.
                'is_orderable' => $data->restaurant->isBookable(),
                'is_open_now' => $data->restaurant->isOpenNow(),
            ] : null,
            'items' => $cartPayload['items'],
            'addresses' => $data->addresses->map(fn (CustomerAddress $a) => $this->address($a))->values()->all(),
            'selected_address_id' => $data->address?->id,
            'in_range' => $data->inRange,
            'range_message' => $data->rangeMessage,
            'distance_miles' => $data->distanceMiles,
            'accepts_cooking_requests' => $data->acceptsCookingRequests,
            'special_instructions' => $data->specialInstructions,
            'applied_coupon' => $data->appliedOffer ? [
                'id' => $data->appliedOffer->id,
                'code' => $data->appliedOffer->code,
                'title' => $data->appliedOffer->title,
                'type' => $data->appliedOffer->type,
                'discount' => $data->itemDiscount,
                'free_delivery' => $data->freeDelivery,
            ] : null,
            'coupon_error' => $data->couponError,
            'available_coupons' => $data->availableCoupons
                ->map(fn (array $row) => $this->coupon($row['offer'], (bool) $row['eligible'], (bool) ($row['upcoming'] ?? false)))
                ->values()->all(),
            'bill' => [
                'item_total' => $data->itemTotal,
                'item_discount' => $data->itemDiscount,
                'delivery_fee' => $data->deliveryFee,
                'free_delivery' => $data->freeDelivery,
                'taxes' => $data->taxes,
                'to_pay' => $data->toPay,
            ],
        ];
    }

    /** @return array<string, mixed> */
    protected function address(CustomerAddress $a): array
    {
        return [
            'id' => $a->id,
            'label' => $a->label,
            'address_line_1' => $a->address_line_1,
            'address_line_2' => $a->address_line_2,
            'city' => $a->city,
            'county' => $a->county,
            'postcode' => $a->postcode,
            'is_default' => (bool) $a->is_default,
            'is_selected' => (bool) $a->is_selected,
        ];
    }

    /** @return array<string, mixed> */
    protected function coupon(Offer $offer, bool $eligible, bool $upcoming): array
    {
        return [
            'id' => $offer->id,
            'code' => $offer->code,
            'title' => $offer->title,
            'description' => $offer->description,
            'type' => $offer->type,
            'value' => (float) $offer->value,
            'headline' => $this->headline($offer),
            'min_order_value' => $offer->min_order_value !== null ? (float) $offer->min_order_value : null,
            'trigger' => $offer->trigger,
            'is_exclusive' => (bool) $offer->is_exclusive,
            'valid_from' => optional($offer->valid_from)->toDateString(),
            'valid_until' => optional($offer->valid_until)->toDateString(),
            'eligible' => $eligible,
            'upcoming' => $upcoming,
        ];
    }

    protected function headline(Offer $offer): string
    {
        return match ($offer->type) {
            Offer::TYPE_PERCENTAGE => rtrim(rtrim(number_format((float) $offer->value, 2), '0'), '.').'% OFF',
            Offer::TYPE_FREE_DELIVERY => 'FREE DELIVERY',
            default => '£'.rtrim(rtrim(number_format((float) $offer->value, 2), '0'), '.').' OFF',
        };
    }
}
