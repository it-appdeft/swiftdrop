<?php

namespace App\Support;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * Builds a consistent pagination `meta` block for the customer JSON/Inertia
 * payloads. Mirrors Laravel's default paginator shape (current_page, links,
 * next/prev urls …) so web pagination controls and API consumers share one
 * contract across the dashboard, restaurant detail, cart and search surfaces.
 */
class PaginationMeta
{
    /**
     * @return array<string, mixed>
     */
    public static function make(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
            'next_page_url' => $paginator->nextPageUrl(),
            'prev_page_url' => $paginator->previousPageUrl(),
            // Numbered links incl. « Previous / Next » — each { url, label, active }.
            'links' => $paginator->linkCollection()->toArray(),
        ];
    }
}
