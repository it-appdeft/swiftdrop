<?php

namespace App\Http\Resources\Customer;

use App\DTO\Customer\CustomerSearchResults;
use App\Services\Customer\CustomerSearchService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Lean search payload for the mobile api: the matched restaurant list and
 * nothing else (pagination is returned as a sibling of `data`; the app sources
 * recent searches / address from their own endpoints). On the `items` search
 * each restaurant carries up to three matching dishes under `items`; on the
 * `restaurant` search there are no nested dishes.
 *
 * `toArray` returns the bare restaurant list so the controller can place it
 * directly under the response `data` key.
 *
 * @property CustomerSearchResults $resource
 */
class CustomerSearchApiResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var CustomerSearchResults $data */
        $data = $this->resource;

        if ($data->type === CustomerSearchService::TYPE_ITEMS) {
            return $data->dishesByRestaurant->map(function (array $row) use ($request) {
                $restaurant = (new DashboardRestaurantResource($row))->resolve($request);
                $restaurant['items'] = SearchDishResource::collection($row['dishes'])->resolve($request);

                return $restaurant;
            })->values()->all();
        }

        return DashboardRestaurantResource::collection($data->restaurants)->resolve($request);
    }
}
