<?php

namespace App\Http\Requests\Support;

/**
 * Customer "Report An Issue" form (profile → Help tab): Order ID, Issue and
 * Details. The Issue field maps onto `subject`, Details onto `description`.
 */
class StoreCustomerTicketRequest extends StoreTicketRequest
{
    /** @return array<string, mixed> */
    protected function additionalRules(): array
    {
        return [
            'order_reference' => ['required', 'string', 'max:100'],
        ];
    }
}
