<?php

namespace App\Http\Resources\Customer;

use App\DTO\Customer\CustomerRestaurantData;
use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @property CustomerRestaurantData $resource */
class CustomerRestaurantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var CustomerRestaurantData $data */
        $data = $this->resource;
        $restaurant = $data->restaurant;
        $rating = $restaurant->rating !== null ? (float) $restaurant->rating : null;

        // Reuse the dashboard/search restaurant shape, then layer on the two
        // detail-only fields the header needs (description + TOP RATED badge).
        $header = (new DashboardRestaurantResource([
            'restaurant' => $restaurant,
            'distance_miles' => $data->distanceMiles,
        ]))->resolve($request);
        $header['description'] = $restaurant->description;
        $header['is_top_rated'] = $rating !== null && $rating >= 4.5;

        return [
            'restaurant' => $header,
            'keyword' => $data->keyword,
            'menu' => $data->menuItems->map(fn (MenuItem $m) => $this->dish($m, $rating))->values()->all(),
            'recommended' => $data->recommended->map(fn (MenuItem $m) => $this->dish($m, $rating))->values()->all(),
        ];
    }

    /**
     * Single menu-item shape, shared by the menu + recommended lists. menu_items
     * carry no per-dish rating, so we surface the restaurant's rating here.
     *
     * @return array<string, mixed>
     */
    protected function dish(MenuItem $item, ?float $rating): array
    {
        return [
            'id' => $item->id,
            'name' => $item->name,
            'description' => $item->description,
            'price' => (float) $item->price,
            'is_veg' => (bool) $item->is_veg,
            'image_url' => $this->dishImageUrl($item),
            'rating' => $rating,
        ];
    }

    protected function dishImageUrl(MenuItem $item): ?string
    {
        $foodItem = $item->foodItem;
        if ($foodItem && $foodItem->image) {
            return '/storage/'.ltrim($foodItem->image, '/');
        }

        return null;
    }
}
