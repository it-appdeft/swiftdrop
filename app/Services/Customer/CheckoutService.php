<?php

namespace App\Services\Customer;

use App\Contracts\Customer\CheckoutServiceInterface;
use App\Contracts\Customer\CustomerCartServiceInterface;
use App\DTO\Customer\CheckoutData;
use App\DTO\Customer\CouponEvaluation;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\CustomerAddress;
use App\Models\Offer;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\User;
use App\Services\Platform\PlatformConfigService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CheckoutService implements CheckoutServiceInterface
{
    public function __construct(
        protected CustomerCartServiceInterface $cart,
        protected CouponService $coupons,
        protected PlatformConfigService $config,
    ) {
    }

    public function summary(User $user, ?int $addressId = null, ?string $couponCode = null): CheckoutData
    {
        $cart = $this->cart->getCart($user)->cart;
        $addresses = $this->userAddresses($user);
        $address = $this->resolveAddress($user, $addressId);

        // Empty cart → nothing to price; controller redirects away.
        if (! $cart instanceof Cart || $cart->items->isEmpty()) {
            return new CheckoutData(
                cart: $cart, restaurant: null, address: $address, addresses: $addresses,
                distanceMiles: null, inRange: false, rangeMessage: null, acceptsCookingRequests: false,
                itemTotal: 0, itemDiscount: 0, deliveryFee: 0, freeDelivery: false, taxes: 0, toPay: 0,
                appliedOffer: null, couponError: null, availableCoupons: collect(),
            );
        }

        $restaurant = $cart->restaurant;
        $subtotal = $this->subtotal($cart);

        [$distance, $inRange, $rangeMessage] = $this->resolveRange($restaurant, $address);

        // Delivery fee + threshold-based free delivery only matter when we can
        // actually deliver; taxes always apply to the item subtotal.
        ['fee' => $baseFee, 'free' => $freeByThreshold] = $inRange
            ? $this->deliveryFee($subtotal, $distance)
            : ['fee' => 0.0, 'free' => false];
        $taxes = $this->taxes($subtotal);

        // Coupon (optional) — surfaced as an inline error, never thrown here.
        $itemDiscount = 0.0;
        $freeByCoupon = false;
        $appliedOffer = null;
        $couponError = null;
        if ($couponCode !== null && $couponCode !== '' && $inRange) {
            try {
                $eval = $this->coupons->evaluate($user, $couponCode, $restaurant, $subtotal, $baseFee);
                $itemDiscount = $eval->itemDiscount;
                $freeByCoupon = $eval->freeDelivery;
                $appliedOffer = $eval->offer;
            } catch (ValidationException $e) {
                $couponError = $e->validator->errors()->first('coupon') ?: 'This coupon could not be applied.';
            }
        }

        $freeDelivery = $freeByThreshold || $freeByCoupon;
        $deliveryFee = $freeDelivery ? 0.0 : $baseFee;
        $toPay = $inRange ? round(max(0, $subtotal - $itemDiscount) + $deliveryFee + $taxes, 2) : 0.0;

        return new CheckoutData(
            cart: $cart,
            restaurant: $restaurant,
            address: $address,
            addresses: $addresses,
            distanceMiles: $distance,
            inRange: $inRange,
            rangeMessage: $rangeMessage,
            acceptsCookingRequests: (bool) $restaurant->accepts_cooking_requests,
            itemTotal: $subtotal,
            itemDiscount: $itemDiscount,
            deliveryFee: $deliveryFee,
            freeDelivery: $freeDelivery,
            taxes: $taxes,
            toPay: $toPay,
            appliedOffer: $appliedOffer,
            couponError: $couponError,
            availableCoupons: $this->coupons->availableFor($user, $restaurant, $subtotal),
        );
    }

    public function place(User $user, int $addressId, ?string $couponCode, ?string $specialInstructions): Order
    {
        $cart = $this->cart->getCart($user)->cart;
        if (! $cart instanceof Cart || $cart->items->isEmpty()) {
            throw ValidationException::withMessages(['cart' => 'Your cart is empty.']);
        }

        $restaurant = $cart->restaurant;
        $address = $this->resolveAddress($user, $addressId);
        if (! $address) {
            throw ValidationException::withMessages(['address_id' => 'Please choose a delivery address.']);
        }

        [$distance, $inRange, $rangeMessage] = $this->resolveRange($restaurant, $address);
        if (! $inRange) {
            throw ValidationException::withMessages(['address_id' => $rangeMessage ?? 'This restaurant does not deliver to that address.']);
        }

        $subtotal = $this->subtotal($cart);
        ['fee' => $baseFee, 'free' => $freeByThreshold] = $this->deliveryFee($subtotal, $distance);
        $taxes = $this->taxes($subtotal);

        $eval = ($couponCode !== null && $couponCode !== '')
            ? $this->coupons->evaluate($user, $couponCode, $restaurant, $subtotal, $baseFee) // throws on invalid
            : null;

        $itemDiscount = $eval?->itemDiscount ?? 0.0;
        $freeDelivery = $freeByThreshold || ($eval?->freeDelivery ?? false);
        $deliveryFee = $freeDelivery ? 0.0 : $baseFee;
        $total = round(max(0, $subtotal - $itemDiscount) + $deliveryFee + $taxes, 2);

        $instructions = $restaurant->accepts_cooking_requests ? ($specialInstructions ?: null) : null;

        return DB::transaction(function () use (
            $user, $restaurant, $cart, $address, $subtotal, $deliveryFee, $itemDiscount,
            $taxes, $total, $instructions, $eval, $baseFee
        ) {
            $order = Order::create([
                'user_id' => $user->id,
                'restaurant_id' => $restaurant->id,
                'status' => 'placed',
                'subtotal' => $subtotal,
                'delivery_fee' => $deliveryFee,
                'discount_amount' => $itemDiscount,
                'vat_amount' => $taxes,
                'total' => $total,
                'address_id' => $address->id,
                'special_instructions' => $instructions,
                'placed_at' => now(),
            ]);

            foreach ($cart->items as $item) {
                $orderItem = $order->items()->create([
                    'menu_item_id' => $item->menu_item_id,
                    'name' => $item->menuItem?->name ?? 'Item',
                    'unit_price' => $item->unit_price,
                    'quantity' => $item->quantity,
                    'subtotal' => round((float) $item->unit_price * $item->quantity, 2),
                ]);

                // Copy the modifier snapshot from cart → order verbatim.
                $modifiers = $item->modifiers->map(fn ($m) => [
                    'modifier_group_id' => $m->modifier_group_id,
                    'modifier_option_id' => $m->modifier_option_id,
                    'group_name' => $m->group_name,
                    'option_name' => $m->option_name,
                    'price_delta' => $m->price_delta,
                ])->all();
                if ($modifiers) {
                    $orderItem->modifiers()->createMany($modifiers);
                }
            }

            if ($eval) {
                $order->offerUsage()->create([
                    'offer_id' => $eval->offer->id,
                    'user_id' => $user->id,
                    'discount_applied' => $eval->totalSaved($baseFee),
                    'created_at' => now(),
                ]);
            }

            // Empty the cart now that it's been turned into an order.
            $this->cart->clear($user);

            return $order;
        });
    }

    // ─── Internals ──────────────────────────────────────────────────────────

    private function subtotal(Cart $cart): float
    {
        return round(
            $cart->items->sum(fn (CartItem $item) => (float) $item->unit_price * $item->quantity),
            2,
        );
    }

    /** @return array{0: ?float, 1: bool, 2: ?string} [distanceMiles, inRange, message] */
    private function resolveRange(Restaurant $restaurant, ?CustomerAddress $address): array
    {
        if (! $address) {
            return [null, false, 'Please choose a delivery address.'];
        }
        if ($address->lat === null || $address->lng === null) {
            return [null, false, 'We couldn’t locate this address on the map. Please edit it and try again.'];
        }

        $distance = $restaurant->distanceMilesFrom((float) $address->lat, (float) $address->lng);
        $radius = max(0.1, $this->config->float(PlatformConfigService::KEY_DASHBOARD_RADIUS_MILES, 5.0));

        if ($distance === null || $distance > $radius) {
            return [$distance, false, 'This restaurant is not within delivery range for the selected address. Please select another address or search for restaurants for this address.'];
        }

        return [$distance, true, null];
    }

    /** @return array{fee: float, free: bool} */
    private function deliveryFee(float $subtotal, ?float $distance): array
    {
        $threshold = $this->config->float(PlatformConfigService::KEY_FREE_DELIVERY_THRESHOLD, 25.0);
        if ($threshold > 0 && $subtotal >= $threshold) {
            return ['fee' => 0.0, 'free' => true];
        }

        $base = $this->config->float(PlatformConfigService::KEY_BASE_DELIVERY_FEE, 1.99);
        $perMile = $this->config->float(PlatformConfigService::KEY_DELIVERY_FEE_PER_MILE, 0.80);

        return ['fee' => round($base + ($distance ?? 0) * $perMile, 2), 'free' => false];
    }

    private function taxes(float $subtotal): float
    {
        $rate = $this->config->float(PlatformConfigService::KEY_ORDER_TAX_RATE, 5.0);

        return round($subtotal * $rate / 100, 2);
    }

    private function resolveAddress(User $user, ?int $addressId): ?CustomerAddress
    {
        $profile = $user->customerProfile;
        if (! $profile) {
            return null;
        }

        if ($addressId) {
            $explicit = $profile->addresses()->find($addressId);
            if ($explicit) {
                return $explicit;
            }
        }

        return $profile->selectedAddress()->first()
            ?? $profile->defaultAddress()->first()
            ?? $profile->addresses()->latest('id')->first();
    }

    /** @return Collection<int, CustomerAddress> */
    private function userAddresses(User $user): Collection
    {
        return $user->customerProfile?->addresses()
            ->orderByDesc('is_selected')
            ->orderByDesc('is_default')
            ->orderByDesc('id')
            ->get() ?? collect();
    }
}
