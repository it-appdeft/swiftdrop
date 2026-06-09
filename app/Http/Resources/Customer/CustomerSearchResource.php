<?php

namespace App\Http\Resources\Customer;

use App\DTO\Customer\CustomerSearchResults;
use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @property CustomerSearchResults $resource */
class CustomerSearchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var CustomerSearchResults $data */
        $data = $this->resource;

        return [
            'type' => $data->type,
            'keyword' => $data->keyword,
            'filters' => [
                'offers' => (bool) ($data->filters['offers'] ?? false),
                'highest_rated' => (bool) ($data->filters['highest_rated'] ?? false),
            ],
            'restaurants' => DashboardRestaurantResource::collection($data->restaurants)->resolve($request),
            'pagination' => $data->restaurantsMeta,
            'dishes_by_restaurant' => $data->dishesByRestaurant->map(function (array $row) use ($request) {
                /** @var Restaurant $restaurant */
                $restaurant = $row['restaurant'];
                $today = $restaurant->todayHours();

                return [
                    'restaurant' => [
                        'id' => $restaurant->id,
                        'name' => $restaurant->name,
                        'city' => $restaurant->city,
                        'logo_url' => $restaurant->logo_url,
                        'cover_url' => $restaurant->banner_url,
                        'rating' => $restaurant->rating !== null ? (float) $restaurant->rating : null,
                        'total_reviews' => (int) $restaurant->total_reviews,
                        'distance_miles' => $row['distance_miles'] ?? null,
                        'is_accepting_orders' => (bool) $restaurant->is_accepting_orders,
                        'is_open_now' => $restaurant->isOpenNow(),
                        'today_hours' => [
                            'is_open' => $today ? (bool) $today->is_open : false,
                            'open_from' => $today && $today->open_from ? substr((string) $today->open_from, 0, 5) : null,
                            'open_to' => $today && $today->open_to ? substr((string) $today->open_to, 0, 5) : null,
                        ],
                    ],
                    'dishes' => SearchDishResource::collection($row['dishes'])->resolve($request),
                ];
            })->values()->all(),
            'recent' => $data->recent->map(fn ($row) => [
                'id' => $row->id,
                'keyword' => $row->keyword,
                'searched_at' => optional($row->searched_at)->toIso8601String(),
            ])->values()->all(),
            'address' => $data->address ? [
                'id' => $data->address->id,
                'label' => $data->address->label,
                'address_line_1' => $data->address->address_line_1,
                'city' => $data->address->city,
                'postcode' => $data->address->postcode,
            ] : null,
            'radius_miles' => $data->radiusMiles,
            'using_fallback' => $data->usingFallback,
        ];
    }
}
