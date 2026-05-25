<?php

namespace App\DTO\Customer;

use App\Models\Cart;

/**
 * Plain carrier for the customer's active cart, from
 * {@see \App\Services\Customer\CustomerCartService} to the web / api layers.
 * Both transports serialise it through the shared
 * {@see \App\Http\Resources\Customer\CustomerCartResource}.
 *
 * `$cart` is null when the customer has no cart yet (or it was emptied); the
 * resource renders that as a zeroed, item-less payload so the frontend can
 * treat "no cart" and "empty cart" identically.
 */
class CustomerCartData
{
    public function __construct(
        public readonly ?Cart $cart,
    ) {
    }
}
