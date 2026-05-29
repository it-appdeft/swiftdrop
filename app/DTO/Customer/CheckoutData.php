<?php

namespace App\DTO\Customer;

use App\Models\Cart;
use App\Models\CustomerAddress;
use App\Models\Offer;
use App\Models\Restaurant;
use Illuminate\Support\Collection;

/**
 * Everything the checkout screen needs: the cart, the chosen + selectable
 * delivery addresses, the distance/in-range gate, the fully computed bill
 * (delivery fee, taxes, coupon discount, total), and the coupon state. Shared
 * by the web (Inertia) and API checkout controllers via
 * {@see \App\Http\Resources\Customer\CheckoutResource}.
 */
class CheckoutData
{
    /**
     * @param  Collection<int, CustomerAddress>  $addresses
     * @param  Collection<int, array{offer: Offer, eligible: bool}>  $availableCoupons
     */
    public function __construct(
        public readonly ?Cart $cart,
        public readonly ?Restaurant $restaurant,
        public readonly ?CustomerAddress $address,
        public readonly Collection $addresses,
        public readonly ?float $distanceMiles,
        public readonly bool $inRange,
        public readonly ?string $rangeMessage,
        public readonly bool $acceptsCookingRequests,
        public readonly float $itemTotal,
        public readonly float $itemDiscount,
        public readonly float $deliveryFee,
        public readonly bool $freeDelivery,
        public readonly float $taxes,
        public readonly float $toPay,
        public readonly ?Offer $appliedOffer,
        public readonly ?string $couponError,
        public readonly Collection $availableCoupons,
    ) {
    }

    public function isEmpty(): bool
    {
        return $this->cart === null || $this->cart->items->isEmpty();
    }
}
