<?php

namespace App\Http\Requests\Customer\Search;

use App\Http\Requests\Concerns\ResolvesDiscoveryCoordinates;
use Illuminate\Foundation\Http\FormRequest;

class SearchRequest extends FormRequest
{
    use ResolvesDiscoveryCoordinates;

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return array_merge([
            'search' => ['nullable', 'string', 'max:120'],
            'offers' => ['nullable', 'boolean'],
            'highest_rated' => ['nullable', 'boolean'],
            // Restaurant-detail menu filters.
            'diet' => ['nullable', 'in:veg,non_veg,all'],
            'min_rating' => ['nullable', 'numeric', 'min:0', 'max:5'],
            // Optional discovery coordinates — only the API search reads these
            // (via locationContext()); the web search ignores them.
        ], $this->coordinateRules());
    }

    public function keyword(): string
    {
        // Accept `search` (current) and `q` (legacy bookmarks) so existing
        // links don't 404.
        return (string) ($this->input('search') ?? $this->input('q') ?? '');
    }

    /**
     * Post-keyword result filters (Offers / Highest rated chips).
     *
     * @return array{offers: bool, highest_rated: bool}
     */
    public function filters(): array
    {
        return [
            'offers' => $this->boolean('offers'),
            'highest_rated' => $this->boolean('highest_rated'),
        ];
    }

    /**
     * Restaurant-detail menu filters (Veg / Non-Veg radio + Ratings 4.0+ chip).
     *
     * @return array{diet: ?string, min_rating: ?float}
     */
    public function menuFilters(): array
    {
        $diet = $this->input('diet');

        return [
            'diet' => in_array($diet, ['veg', 'non_veg'], true) ? $diet : null,
            'min_rating' => $this->filled('min_rating') ? (float) $this->input('min_rating') : null,
        ];
    }
}
