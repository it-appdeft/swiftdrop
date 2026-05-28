<?php

namespace App\Http\Controllers\Api\Customer;

use App\Contracts\Customer\CustomerCartServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\Cart\AddCartItemRequest;
use App\Http\Requests\Customer\Cart\UpdateCartItemRequest;
use App\Http\Resources\Customer\CustomerCartResource;
use App\Support\PaginationMeta;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

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

    /** Default page size for cart line items. */
    protected const CART_ITEMS_PER_PAGE = 10;

    public function index(Request $request): JsonResponse
    {
        // Paginate items at the controller layer (not the resource) — store,
        // update, destroy and clear keep returning the full cart so callers
        // can render the entire cart after a mutation.
        $payload = (new CustomerCartResource($this->cart->getCart($request->user())))->resolve($request);

        $page = max(1, (int) $request->query('page', 1));
        $perPage = max(1, min(50, (int) $request->query('per_page', self::CART_ITEMS_PER_PAGE)));
        $allItems = $payload['items'];
        $pageItems = array_slice($allItems, ($page - 1) * $perPage, $perPage);

        $paginator = new LengthAwarePaginator(
            items: $pageItems,
            total: count($allItems),
            perPage: $perPage,
            currentPage: $page,
            options: ['path' => url('/api/customer/cart')],
        );

        $payload['items'] = $pageItems;
        $payload['items_meta'] = PaginationMeta::make($paginator);

        return $this->success(
            data: $payload,
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
