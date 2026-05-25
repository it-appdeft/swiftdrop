<?php

namespace App\Http\Controllers\Api\Customer;

use App\Contracts\Customer\CheckoutServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\Checkout\PlaceOrderRequest;
use App\Http\Resources\Customer\CheckoutResource;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * JSON checkout endpoints for mobile / external clients. Drives the same
 * service, request and resource as the web controller.
 */
class CheckoutController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected CheckoutServiceInterface $checkout,
    ) {
    }

    public function summary(Request $request): JsonResponse
    {
        $addressId = $request->integer('address_id') ?: null;
        $coupon = $request->string('coupon')->toString() ?: null;

        $data = $this->checkout->summary($request->user(), $addressId, $coupon);

        return $this->success(
            data: new CheckoutResource($data),
            message: 'Checkout summary retrieved.',
        );
    }

    public function store(PlaceOrderRequest $request): JsonResponse
    {
        $order = $this->checkout->place(
            $request->user(),
            $request->addressId(),
            $request->couponCode(),
            $request->specialInstructions(),
        );

        return $this->success(
            data: [
                'order' => [
                    'uuid' => $order->uuid,
                    'status' => $order->status,
                    'total' => (float) $order->total,
                ],
            ],
            message: 'Order placed.',
            status: 201,
        );
    }
}
