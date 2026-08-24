<?php

namespace App\Http\Controllers\Api\Driver;

use App\Contracts\Driver\OrderStatusServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Driver\OrderStatus\UpdateStatusRequest;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

/**
 * Driver-side order status progression for an in-flight delivery:
 * reached_restaurant → picked_up → delivered. picked_up and delivered each
 * require the OTP the driver collects on handover, verified against
 * orders.pick_up_code / orders.delivery_code (see OrderStatusService).
 */
class OrderStatusController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected OrderStatusServiceInterface $orderStatus,
    ) {
    }

    public function statusUpdate(UpdateStatusRequest $request, int $delivery): JsonResponse
    {
        $result = $this->orderStatus->updateStatus(
            auth('sanctum')->user(),
            $delivery,
            $request->status(),
            $request->otp(),
        );

        return $this->success(
            data: [
                'delivery_id' => $result->id,
                'delivery_status' => $result->status,
                'order_id' => $result->order_id,
                'order_status' => $result->order->status,
            ],
            message: "Order marked {$request->status()}.",
        );
    }
}
