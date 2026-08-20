<?php

namespace App\Http\Requests\Customer\Discovery;

use App\Http\Requests\Concerns\ResolvesDiscoveryCoordinates;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Shared query validation for the API restaurant-discovery endpoints
 * (Top Picks + paginated restaurants).
 *
 * Carries the frontend-provided latitude/longitude that — unlike the web,
 * which derives them from the customer's selected address — drive discovery and
 * distance calculation. Coordinates are optional; see
 * {@see ResolvesDiscoveryCoordinates}.
 */
class RestaurantDiscoveryRequest extends FormRequest
{
    use ResolvesDiscoveryCoordinates;

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return array_merge([
            'page' => ['nullable', 'integer', 'min:1'],
            'search' => ['nullable', 'integer', 'min:1'],
        ], $this->coordinateRules());
    }

    public function page(): int
    {
        return max(1, (int) $this->query('page', 1));
    }

    /** Active food-type filter (the `search` query param), if any. */
    public function foodTypeId(): ?int
    {
        return $this->filled('search') ? max(1, (int) $this->query('search')) : null;
    }
}
