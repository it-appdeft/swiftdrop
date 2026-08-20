<?php

namespace App\Support\Location;

use App\Models\CustomerAddress;

/**
 * Resolved discovery coordinates for restaurant listing / Top Picks.
 *
 * Decouples *where* a coordinate comes from (a saved address on the web, the
 * frontend-provided latitude/longitude on the API) from *how* the discovery
 * queries consume it. A context with no coordinates means "no location filter"
 * — callers fall back to their non-geo ordering and emit null distances rather
 * than throwing.
 */
final class LocationContext
{
    private function __construct(
        public readonly ?float $lat = null,
        public readonly ?float $lng = null,
    ) {
    }

    /** Empty context — no coordinates, no geo filtering. */
    public static function none(): self
    {
        return new self();
    }

    /**
     * Explicit coordinates supplied by an API client. Treated as geocoded only
     * when BOTH values are present; a partial pair degrades to {@see none()} so
     * the response stays valid instead of half-filtering.
     */
    public static function fromCoordinates(?float $lat, ?float $lng): self
    {
        if ($lat === null || $lng === null) {
            return self::none();
        }

        return new self($lat, $lng);
    }

    /**
     * Coordinates from the customer's saved address — the web discovery source.
     * Falls back to {@see none()} when the address is absent or not geocoded.
     */
    public static function fromAddress(?CustomerAddress $address): self
    {
        if (! $address || $address->lat === null || $address->lng === null) {
            return self::none();
        }

        return new self((float) $address->lat, (float) $address->lng);
    }

    public function hasCoordinates(): bool
    {
        return $this->lat !== null && $this->lng !== null;
    }
}
