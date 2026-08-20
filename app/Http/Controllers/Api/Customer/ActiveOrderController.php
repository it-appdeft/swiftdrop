<?php

namespace App\Http\Controllers\Api\Customer;

use App\Contracts\Customer\ActiveOrderServiceInterface;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Backs the mobile app's persistent "active order" bar/tab. Same service as
 * {@see \App\Http\Controllers\Web\Customer\ActiveOrderController} — see there
 * for the polling/placement details shared with the web bar.
 */
class ActiveOrderController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ActiveOrderServiceInterface $activeOrders,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        return $this->success(
            data: $this->activeOrders->active($request->user()),
            message: 'Active orders retrieved.',
        );
    }
}
