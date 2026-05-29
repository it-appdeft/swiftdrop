<?php

namespace App\Http\Controllers\Web\Customer;

use App\Contracts\Customer\CheckoutServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\Checkout\PlaceOrderRequest;
use App\Http\Resources\Customer\CheckoutResource;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Web counterpart of {@see \App\Http\Controllers\Api\Customer\CheckoutController}.
 * The summary recomputes on every visit (address / coupon are query params), so
 * changing address or applying a coupon is a plain Inertia GET. Placing the
 * order redirects to the dashboard with a success flash.
 */
class CheckoutController extends Controller
{
    public function __construct(
        protected CheckoutServiceInterface $checkout,
    ) {
    }

    public function index(Request $request): Response|RedirectResponse
    {
        $addressId = $request->integer('address_id') ?: null;
        $coupon = $request->string('coupon')->toString() ?: null;

        $data = $this->checkout->summary($request->user(), $addressId, $coupon);

        // No items → bounce back to the cart.
        if ($data->isEmpty()) {
            return redirect()->route('customer.cart');
        }

        return Inertia::render('customer/checkout', [
            'checkout' => (new CheckoutResource($data))->resolve($request),
        ]);
    }

    public function store(PlaceOrderRequest $request): RedirectResponse
    {
        $this->checkout->place(
            $request->user(),
            $request->addressId(),
            $request->couponCode(),
            $request->specialInstructions(),
        );

        // Flash a dedicated key so the dashboard can show a success modal
        // (see customer/pages/dashboard.tsx). We avoid 'status' here so the
        // global toast listener in app.tsx doesn't fire a duplicate toast.
        return redirect()->route('customer.dashboard')->with('order_placed', true);
    }
}
