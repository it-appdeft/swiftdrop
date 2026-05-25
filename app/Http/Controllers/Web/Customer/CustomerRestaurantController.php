<?php

namespace App\Http\Controllers\Web\Customer;

use App\Contracts\Customer\CustomerCartServiceInterface;
use App\Contracts\Customer\CustomerRestaurantServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\Search\SearchRequest;
use App\Http\Resources\Customer\CustomerCartResource;
use App\Http\Resources\Customer\CustomerRestaurantResource;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Web counterpart of {@see \App\Http\Controllers\Api\Customer\CustomerRestaurantController}.
 * Reuses the same service, request and resource — only the response layer
 * differs (Inertia render vs. JSON envelope).
 */
class CustomerRestaurantController extends Controller
{
    public function __construct(
        protected CustomerRestaurantServiceInterface $restaurants,
        protected CustomerCartServiceInterface $cart,
    ) {
    }

    public function show(SearchRequest $request, int $id): Response
    {
        $data = $this->restaurants->show($request->user(), $id, $request->keyword());
        $cart = $this->cart->getCart($request->user());

        return Inertia::render('customer/restaurant', [
            'restaurant' => (new CustomerRestaurantResource($data))->resolve($request),
            // Embedded so the page renders qty steppers + the sticky cart bar
            // without a second request. Refreshed on every cart mutation
            // (which redirects back here).
            'cart' => (new CustomerCartResource($cart))->resolve($request),
        ]);
    }
}
