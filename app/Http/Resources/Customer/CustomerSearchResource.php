<?php

namespace App\Http\Resources\Customer;

use App\DTO\Customer\CustomerSearchResults;
use App\Models\MenuItem;
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
            'keyword' => $data->keyword,
            'restaurants' => DashboardRestaurantResource::collection($data->restaurants)->resolve($request),
            'dishes_by_restaurant' => $data->dishesByRestaurant->map(function (array $row) {
                /** @var Restaurant $restaurant */
                $restaurant = $row['restaurant'];

                return [
                    'restaurant' => [
                        'id' => $restaurant->id,
                        'name' => $restaurant->name,
                        'city' => $restaurant->city,
                        'logo_url' => $this->absoluteUrl($restaurant->logo_path),
                        'cover_url' => $this->absoluteUrl($restaurant->cover_photo_path),
                        'rating' => $restaurant->rating !== null ? (float) $restaurant->rating : null,
                        'total_reviews' => (int) $restaurant->total_reviews,
                        'distance_miles' => $row['distance_miles'] ?? null,
                    ],
                    'dishes' => $row['dishes']->map(fn (MenuItem $m) => [
                        'id' => $m->id,
                        'name' => $m->name,
                        'description' => $m->description,
                        'price' => (float) $m->price,
                        'is_veg' => (bool) $m->is_veg,
                        'image_url' => $this->dishImageUrl($m),
                    ])->values()->all(),
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

    protected function dishImageUrl(MenuItem $item): ?string
    {
        $foodItem = $item->foodItem;
        if ($foodItem && $foodItem->image) {
            return '/storage/'.ltrim($foodItem->image, '/');
        }

        return null;
    }

    protected function absoluteUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        return '/storage/'.ltrim($path, '/');
    }
}
