<?php

namespace App\Http\Controllers\Web\Customer;

use App\Contracts\Customer\ActiveOrderServiceInterface;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

/**
 * JSON-only endpoint backing the `<ActiveOrderBar>` component mounted
 * globally in app.tsx — polled from any customer screen so the bar can show
 * up regardless of which page is on screen. Web counterpart of
 * {@see \App\Http\Controllers\Api\Customer\ActiveOrderController}; both share
 * {@see \App\Services\Customer\ActiveOrderService}.
 */
class ActiveOrderController extends Controller
{
    public function __construct(
        protected ActiveOrderServiceInterface $activeOrders,
    ) {
    }

    public function index(): JsonResponse
    {
        return response()->json([
            'orders' => $this->activeOrders->active(Auth::user()),
        ]);
    }
}
