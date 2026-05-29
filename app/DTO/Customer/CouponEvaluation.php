<?php

namespace App\DTO\Customer;

use App\Models\Offer;

/**
 * Outcome of applying a coupon to an order: how much comes off the item
 * subtotal, and whether delivery becomes free. Produced by
 * {@see \App\Services\Customer\CouponService::evaluate()}.
 */
class CouponEvaluation
{
    public function __construct(
        public readonly Offer $offer,
        public readonly float $itemDiscount,
        public readonly bool $freeDelivery,
    ) {
    }

    /** Total amount the customer saves, given the delivery fee in play. */
    public function totalSaved(float $deliveryFee): float
    {
        return round($this->itemDiscount + ($this->freeDelivery ? $deliveryFee : 0.0), 2);
    }
}
