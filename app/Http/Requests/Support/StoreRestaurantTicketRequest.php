<?php

namespace App\Http\Requests\Support;

/**
 * Restaurant "Raise a ticket" form (Support page): Subject, Category and a
 * free-text description.
 */
class StoreRestaurantTicketRequest extends StoreTicketRequest
{
    /** @return array<string, mixed> */
    protected function additionalRules(): array
    {
        return [
            'category' => ['required', 'string', 'max:100'],
        ];
    }
}
