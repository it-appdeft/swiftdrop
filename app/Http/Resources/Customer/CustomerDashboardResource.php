<?php

namespace App\Http\Resources\Customer;

use App\DTO\Customer\CustomerDashboardData;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @property CustomerDashboardData $resource */
class CustomerDashboardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var CustomerDashboardData $data */
        $data = $this->resource;

        return [
            'food_items' => FoodItemResource::collection($data->foodItems)->resolve($request),
            'food_items_meta' => [
                'current_page' => $data->foodItemsCurrentPage,
                'last_page' => $data->foodItemsLastPage,
                'per_page' => $data->foodItemsPerPage,
                'total' => $data->foodItemsTotal,
            ],
            'restaurants' => DashboardRestaurantResource::collection($data->restaurants)->resolve($request),
            'restaurants_meta' => [
                'current_page' => $data->restaurantsCurrentPage,
                'last_page' => $data->restaurantsLastPage,
                'per_page' => $data->restaurantsPerPage,
                'total' => $data->restaurantsTotal,
            ],
            'address' => $data->address ? [
                'id' => $data->address->id,
                'label' => $data->address->label,
                'address_line_1' => $data->address->address_line_1,
                'city' => $data->address->city,
                'postcode' => $data->address->postcode,
                'lat' => $data->address->lat !== null ? (float) $data->address->lat : null,
                'lng' => $data->address->lng !== null ? (float) $data->address->lng : null,
            ] : null,
            'radius_miles' => $data->radiusMiles,
            'using_fallback' => $data->usingFallback,
            // Active food-item filter (null when no filter). The frontend uses
            // this to highlight the chip in the strip and show a banner above
            // the restaurants section.
            'selected_food_item' => $data->selectedFoodItem ? [
                'id' => $data->selectedFoodItem->id,
                'name' => $data->selectedFoodItem->name,
                'slug' => $data->selectedFoodItem->slug,
                'image_url' => $data->selectedFoodItem->image_url,
            ] : null,
        ];
    }
}
