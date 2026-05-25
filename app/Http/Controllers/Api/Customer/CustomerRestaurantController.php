<?php

namespace App\Http\Controllers\Api\Customer;

use App\Contracts\Customer\CustomerRestaurantServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\Search\SearchRequest;
use App\Http\Resources\Customer\CustomerRestaurantResource;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class CustomerRestaurantController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected CustomerRestaurantServiceInterface $restaurants,
    ) {
    }

    public function show(SearchRequest $request, int $id): JsonResponse
    {
        $data = $this->restaurants->show($request->user(), $id, $request->keyword());

        return $this->success(
            data: new CustomerRestaurantResource($data),
            message: 'Restaurant retrieved.',
        );
    }
}
