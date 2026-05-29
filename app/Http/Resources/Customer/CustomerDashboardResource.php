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
            'restaurants' => DashboardRestaurantResource::collection($data->restaurants)->resolve($request),
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
        ];
    }
}
