<?php

namespace App\Support;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * Builds the `pagination` block for the customer JSON/Inertia payloads — a
 * lean, consistent shape (current_page / last_page / per_page / total) shared
 * across the dashboard, restaurant detail, cart, search, favourites, orders
 * and addresses surfaces.
 */
class PaginationMeta
{
    /**
     * @return array{current_page: int, last_page: int, per_page: int, total: int}
     */
    public static function make(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ];
    }
}
