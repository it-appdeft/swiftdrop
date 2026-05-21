<?php

namespace App\Http\Resources\Customer;

use App\DTO\Customer\CustomerSearchResults;
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
            'menu_items' => SearchMenuItemResource::collection($data->menuItems)->resolve($request),
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
