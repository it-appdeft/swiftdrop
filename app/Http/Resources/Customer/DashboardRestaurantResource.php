<?php

namespace App\Http\Resources\Customer;

use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Wraps a {restaurant, distance_miles} tuple emitted by
 * {@see \App\Services\Customer\CustomerDashboardService}.
 */
class DashboardRestaurantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var Restaurant $r */
        $r = $this->resource['restaurant'];
        $distance = $this->resource['distance_miles'] ?? null;

        return [
            'id' => $r->id,
            'name' => $r->name,
            'tagline' => $r->tagline,
            'cuisines' => $r->cuisines,
            'city' => $r->city,
            'full_address' => $r->full_address,
            'logo_url' => $r->logo_url,
            'cover_url' => $r->banner_url,
            'rating' => $r->rating !== null ? (float) $r->rating : null,
            'total_reviews' => (int) $r->total_reviews,
            'distance_miles' => $distance,
            // Whether the partner is currently taking orders (the manual pause
            // toggle). The web grays out and blocks cards where this is false.
            'is_accepting_orders' => (bool) $r->is_accepting_orders,
            // Live open/closed per today's operating hours (independent of the
            // pause toggle above) plus today's window so the card can show a
            // "Open · til HH:MM" / "Closed" status line.
            'is_open_now' => $r->isOpenNow(),
            'today_hours' => $this->todayHours($r),
            // Optional — present on dashboard / restaurants index rows so the
            // heart icon on each card reflects the customer's saved list.
            'is_favorited' => (bool) ($this->resource['is_favorited'] ?? false),
        ];
    }

    /**
     * Today's open/close window in HH:MM, or an all-null "closed" shape when
     * the restaurant has no hours row for today.
     *
     * @return array{is_open: bool, open_from: ?string, open_to: ?string}
     */
    protected function todayHours(Restaurant $r): array
    {
        $row = $r->todayHours();

        return [
            'is_open' => $row ? (bool) $row->is_open : false,
            'open_from' => $row && $row->open_from ? substr((string) $row->open_from, 0, 5) : null,
            'open_to' => $row && $row->open_to ? substr((string) $row->open_to, 0, 5) : null,
        ];
    }
}
