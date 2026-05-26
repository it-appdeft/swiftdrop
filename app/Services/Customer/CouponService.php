<?php

namespace App\Services\Customer;

use App\DTO\Customer\CouponEvaluation;
use App\Models\Offer;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

/**
 * Coupon eligibility + discount maths, shared by the checkout summary
 * (listing + preview) and order placement (final validation). Throws a
 * {@see ValidationException} keyed on `coupon` so both web and API surface a
 * friendly message.
 */
class CouponService
{
    public const DEFAULT_WELCOME_ORDERS = 3;

    /**
     * Coupons this customer can see for this order — active, in their validity
     * window, applicable to the restaurant, and trigger-eligible. Each carries
     * an `eligible` flag (min-order met) so the UI can disable but still show
     * coupons the customer is close to unlocking.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function availableFor(User $user, Restaurant $restaurant, float $subtotal): Collection
    {
        return Offer::query()
            ->active()
            ->notExpired()
            ->orderByDesc('value')
            ->get()
            ->filter(fn (Offer $offer) => $this->isApplicableToRestaurant($offer, $restaurant)
                && $this->triggerEligible($offer, $user))
            ->map(function (Offer $offer) use ($user, $subtotal) {
                $upcoming = $offer->valid_from !== null && $offer->valid_from->isFuture();

                return [
                    'offer' => $offer,
                    // Upcoming coupons are shown but not applyable yet.
                    'eligible' => ! $upcoming
                        && $this->minOrderMet($offer, $subtotal)
                        && $this->withinUsageLimits($offer, $user),
                    'upcoming' => $upcoming,
                ];
            })
            ->values();
    }

    /**
     * Validate a coupon code for this order and return the resulting discount.
     * Throws ValidationException('coupon') on any failure.
     */
    public function evaluate(User $user, string $code, Restaurant $restaurant, float $subtotal, float $deliveryFee): CouponEvaluation
    {
        $offer = Offer::query()->whereRaw('UPPER(code) = ?', [strtoupper(trim($code))])->first();

        if (! $offer || ! $offer->is_active) {
            $this->fail('This coupon code is not valid.');
        }
        if (! $this->isCurrentlyValid($offer)) {
            $this->fail('This coupon has expired or is not active yet.');
        }
        if (! $this->isApplicableToRestaurant($offer, $restaurant)) {
            $this->fail('This coupon cannot be used at this restaurant.');
        }
        if (! $this->triggerEligible($offer, $user)) {
            $this->fail($offer->trigger === Offer::TRIGGER_WEEKEND
                ? 'This coupon is only valid on weekends.'
                : 'This coupon is only available on your first few orders.');
        }
        if (! $this->withinUsageLimits($offer, $user)) {
            $this->fail('You have already used this coupon the maximum number of times.');
        }
        if (! $this->minOrderMet($offer, $subtotal)) {
            $this->fail('Add £'.number_format(((float) $offer->min_order_value) - $subtotal, 2).' more to use this coupon.');
        }

        return $this->discountFor($offer, $subtotal);
    }

    private function discountFor(Offer $offer, float $subtotal): CouponEvaluation
    {
        if ($offer->type === Offer::TYPE_FREE_DELIVERY) {
            return new CouponEvaluation($offer, 0.0, true);
        }

        if ($offer->type === Offer::TYPE_PERCENTAGE) {
            $raw = $subtotal * ((float) $offer->value) / 100;
            if ($offer->max_discount !== null) {
                $raw = min($raw, (float) $offer->max_discount);
            }

            return new CouponEvaluation($offer, round(min($raw, $subtotal), 2), false);
        }

        // Flat amount off.
        return new CouponEvaluation($offer, round(min((float) $offer->value, $subtotal), 2), false);
    }

    // ─── Eligibility checks ────────────────────────────────────────────────────

    private function isCurrentlyValid(Offer $offer, ?Carbon $at = null): bool
    {
        $at ??= Carbon::now();

        return ($offer->valid_from === null || $offer->valid_from->lte($at))
            && ($offer->valid_until === null || $offer->valid_until->gte($at));
    }

    private function isApplicableToRestaurant(Offer $offer, Restaurant $restaurant): bool
    {
        return match ($offer->applicable_to) {
            'restaurant' => (int) $offer->applicable_id === $restaurant->id,
            default => true, // 'all' (category/item targeting not yet surfaced)
        };
    }

    private function triggerEligible(Offer $offer, User $user): bool
    {
        return match ($offer->trigger) {
            Offer::TRIGGER_WEEKEND => Carbon::now()->isWeekend(),
            Offer::TRIGGER_WELCOME => $user->orders()->count() < ($offer->max_uses_per_user ?? self::DEFAULT_WELCOME_ORDERS),
            default => true,
        };
    }

    private function withinUsageLimits(Offer $offer, User $user): bool
    {
        if ($offer->max_uses !== null && $offer->usages()->count() >= $offer->max_uses) {
            return false;
        }
        if ($offer->max_uses_per_user !== null
            && $offer->usages()->where('user_id', $user->id)->count() >= $offer->max_uses_per_user) {
            return false;
        }

        return true;
    }

    private function minOrderMet(Offer $offer, float $subtotal): bool
    {
        return $offer->min_order_value === null || $subtotal >= (float) $offer->min_order_value;
    }

    private function fail(string $message): never
    {
        throw ValidationException::withMessages(['coupon' => $message]);
    }
}
