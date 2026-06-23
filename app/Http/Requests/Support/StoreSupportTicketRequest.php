<?php

namespace App\Http\Requests\Support;

use App\Enums\UserRoleEnum;

/**
 * Shared API request for the mobile "Help Center" form used by both customers
 * and drivers: Title (subject) + Explain the problem (description). Order
 * reference / category are optional so the same endpoint serves every client.
 */
class StoreSupportTicketRequest extends StoreTicketRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && (
            $user->hasRole(UserRoleEnum::CUSTOMER->value)
            || $user->hasRole(UserRoleEnum::DRIVER->value)
        );
    }

    /** @return array<string, mixed> */
    protected function additionalRules(): array
    {
        return [
            'order_reference' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:100'],
        ];
    }
}
