<?php

namespace App\Http\Controllers\Api\Customer;

use App\Contracts\Customer\CustomerCartServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\Cart\AddCartItemRequest;
use App\Http\Requests\Customer\Cart\UpdateCartItemRequest;
use App\Http\Resources\Customer\CustomerCartResource;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * JSON cart endpoints for mobile / external clients. The web counterpart
 * {@see \App\Http\Controllers\Web\Customer\CustomerCartController} drives the
 * exact same service, requests and resource — only the response layer differs.
 */
class CustomerCartController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected CustomerCartServiceInterface $cart,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        return $this->success(
            data: new CustomerCartResource($this->cart->getCart($request->user())),
            message: 'Cart retrieved.',
        );
    }

    public function store(AddCartItemRequest $request): JsonResponse
    {
        $data = $this->cart->addItem(
            $request->user(),
            $request->menuItemId(),
            $request->quantity(),
            $request->optionIds(),
        );

        return $this->success(
            data: new CustomerCartResource($data),
            message: 'Item added to cart.',
            status: 201,
        );
    }

    public function update(UpdateCartItemRequest $request, int $itemId): JsonResponse
    {
        $data = $this->cart->updateItemQuantity($request->user(), $itemId, $request->quantity());

        return $this->success(
            data: new CustomerCartResource($data),
            message: 'Cart updated.',
        );
    }

    public function destroy(Request $request, int $itemId): JsonResponse
    {
        $data = $this->cart->removeItem($request->user(), $itemId);

        return $this->success(
            data: new CustomerCartResource($data),
            message: 'Item removed from cart.',
        );
    }

    public function clear(Request $request): JsonResponse
    {
        $data = $this->cart->clear($request->user());

        return $this->success(
            data: new CustomerCartResource($data),
            message: 'Cart cleared.',
        );
    }
}
