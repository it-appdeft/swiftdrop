<?php

namespace App\Http\Requests\Concerns;

use App\Support\Location\LocationContext;

/**
 * Shared handling of the optional frontend-provided discovery coordinates
 * (latitude/longitude) used by the API restaurant-discovery and search
 * endpoints. Keeps the rules + resolution in one place so every discovery
 * request reads coordinates identically.
 */
trait ResolvesDiscoveryCoordinates
{
    /**
     * Validation rules for the optional discovery coordinates. Both are
     * nullable — a missing or partial pair is not an error; only their range is
     * enforced. Merge into the request's own rules().
     *
     * @return array<string, array<int, string>>
     */
    protected function coordinateRules(): array
    {
        return [
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ];
    }

    /**
     * Frontend-provided discovery coordinates. Null-safe: a missing or partial
     * lat/lng pair resolves to an empty {@see LocationContext} (no geo filter,
     * null distances) rather than deriving from the saved address.
     */
    public function locationContext(): LocationContext
    {
        return LocationContext::fromCoordinates(
            $this->filled('latitude') ? (float) $this->input('latitude') : null,
            $this->filled('longitude') ? (float) $this->input('longitude') : null,
        );
    }
}
