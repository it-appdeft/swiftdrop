<?php

namespace App\Http\Resources\Customer;

use App\Models\MenuItem;
use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Wraps the {menu_item, restaurant, distance_miles} tuple produced by
 * {@see \App\Services\Customer\CustomerSearchService}.
 */
class SearchMenuItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var MenuItem $item */
        $item = $this->resource['menu_item'];
        /** @var Restaurant $restaurant */
        $restaurant = $this->resource['restaurant'];

        return [
            'id' => $item->id,
            'name' => $item->name,
            'description' => $item->description,
            'price' => (float) $item->price,
            'is_veg' => (bool) $item->is_veg,
            'restaurant' => [
                'id' => $restaurant->id,
                'name' => $restaurant->name,
                'city' => $restaurant->city,
            ],
            'distance_miles' => $this->resource['distance_miles'] ?? null,
        ];
    }
}
