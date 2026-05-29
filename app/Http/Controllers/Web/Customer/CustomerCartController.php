<?php

namespace App\Http\Controllers\Web\Customer;

use App\Contracts\Customer\CustomerCartServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\Cart\AddCartItemRequest;
use App\Http\Requests\Customer\Cart\UpdateCartItemRequest;
use App\Http\Resources\Customer\CustomerCartResource;
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

    public function index(Request $request): Response
    {
        return Inertia::render('customer/cart', [
            'cart' => (new CustomerCartResource($this->cart->getCart($request->user())))->resolve($request),
        ]);
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
