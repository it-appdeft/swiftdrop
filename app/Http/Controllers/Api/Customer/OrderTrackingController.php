<?php

namespace App\Http\Controllers\Api\Customer;

use App\Contracts\Customer\OrderTrackingServiceInterface;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * JSON order-tracking endpoints for mobile / external clients. Drives the
 * same service as the web controller — see
 * {@see \App\Http\Controllers\Web\Customer\OrderTrackingController}.
 */
class OrderTrackingController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected OrderTrackingServiceInterface $tracking,
    ) {
    }

    /**
     * Polled by the client (every 5s while the app is on the order screen)
     * to pick up status changes without a realtime channel.
     */
    public function status(Request $request, string $order): JsonResponse
    {
        return $this->success(
            data: $this->tracking->status($request->user(), $order),
            message: 'Order status retrieved.',
        );
    }

    public function cancel(Request $request, string $order): JsonResponse
    {
        $reason = $request->string('reason')->toString() ?: null;

        return $this->success(
            data: $this->tracking->cancel($request->user(), $order, $reason),
            message: 'Order cancelled.',
        );
    }
}
