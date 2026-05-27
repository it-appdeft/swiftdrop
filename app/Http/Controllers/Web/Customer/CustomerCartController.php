<?php

namespace App\Http\Controllers\Web\Customer;

use App\Contracts\Customer\CustomerCartServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\Cart\AddCartItemRequest;
use App\Http\Requests\Customer\Cart\UpdateCartItemRequest;
use App\Http\Resources\Customer\CustomerCartResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Web counterpart of {@see \App\Http\Controllers\Api\Customer\CustomerCartController}.
 * Mutations redirect back so Inertia re-renders the originating page (the
 * restaurant detail page) with the refreshed `cart` prop — that's what drives
 * the in-list quantity steppers and the sticky cart bar updating in place.
 */
class CustomerCartController extends Controller
{
    public function __construct(
        protected CustomerCartServiceInterface $cart,
    ) {
    }

    /** Default page size for the cart page's items list. */
    protected const CART_ITEMS_PER_PAGE = 10;

    public function index(Request $request): Response|JsonResponse
    {
        $payload = $this->paginatedCartPayload($request);

        // Infinite-scroll subsequent pages are fetched as JSON so they can be
        // appended client-side without re-rendering the whole Inertia page.
        if ($request->wantsJson()) {
            return response()->json($payload);
        }

        return Inertia::render('customer/cart', ['cart' => $payload]);
    }

    /**
     * Build the cart payload and slice its items array to the requested page.
     * Subtotal + item_count remain accurate because they're computed from the
     * FULL items collection inside CustomerCartResource before this slice.
     *
     * @return array<string, mixed>
     */
    protected function paginatedCartPayload(Request $request): array
    {
        $payload = (new CustomerCartResource($this->cart->getCart($request->user())))->resolve($request);

        $page = max(1, (int) $request->query('page', 1));
        $perPage = self::CART_ITEMS_PER_PAGE;
        $total = count($payload['items']);

        $payload['items'] = array_slice($payload['items'], ($page - 1) * $perPage, $perPage);
        $payload['items_meta'] = [
            'current_page' => $page,
            'last_page' => max(1, (int) ceil($total / $perPage)),
            'per_page' => $perPage,
            'total' => $total,
        ];

        return $payload;
    }

    public function store(AddCartItemRequest $request): RedirectResponse
    {
        $this->cart->addItem(
            $request->user(),
            $request->menuItemId(),
            $request->quantity(),
            $request->optionIds(),
        );

        return back()->with('status', 'Added to cart.');
    }

    public function update(UpdateCartItemRequest $request, int $itemId): RedirectResponse
    {
        $this->cart->updateItemQuantity($request->user(), $itemId, $request->quantity());

        return back();
    }

    public function destroy(Request $request, int $itemId): RedirectResponse
    {
        $this->cart->removeItem($request->user(), $itemId);

        return back()->with('status', 'Item removed from cart.');
    }

    public function clear(Request $request): RedirectResponse
    {
        $this->cart->clear($request->user());

        return back()->with('status', 'Cart cleared.');
    }
}
