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
            'logo_url' => $this->absoluteUrl($r->logo_path),
            'cover_url' => $this->absoluteUrl($r->cover_photo_path),
            'rating' => $r->rating !== null ? (float) $r->rating : null,
            'total_reviews' => (int) $r->total_reviews,
            'distance_miles' => $distance,
        ];
    }

    protected function absoluteUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        return '/storage/' . ltrim($path, '/');
    }
}
