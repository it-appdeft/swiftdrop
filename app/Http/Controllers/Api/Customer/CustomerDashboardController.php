<?php

namespace App\Http\Controllers\Api\Customer;

use App\Contracts\Customer\CustomerDashboardServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Resources\Customer\CustomerDashboardResource;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class CustomerDashboardController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected CustomerDashboardServiceInterface $dashboard,
    ) {
    }

    public function index(): JsonResponse
    {
        $user = auth('sanctum')->user();
        $data = $this->dashboard->build($user);

        return $this->success(
            data: new CustomerDashboardResource($data),
            message: 'Dashboard retrieved.',
        );
    }
}
