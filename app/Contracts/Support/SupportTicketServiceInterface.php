<?php

namespace App\Contracts\Support;

use App\Enums\TicketSourceEnum;
use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * Single home for support-ticket bookkeeping. Every entry point — the customer
 * Help form (web + API), the restaurant Support page, and the admin console —
 * funnels through here so creation, listing and status changes stay identical
 * regardless of which controller is calling.
 */
interface SupportTicketServiceInterface
{
    /**
     * Open a ticket on behalf of the user. `$source` records where it came
     * from; restaurant tickets also pin the partner's restaurant.
     *
     * @param  array<string, mixed>  $data
     */
    public function create(User $user, TicketSourceEnum $source, array $data): SupportTicket;

    /**
     * Tickets the given user raised (their own queue) — used by the customer
     * API list and the restaurant Support page.
     *
     * @param  array<string, mixed>  $filters
     */
    public function paginateForUser(User $user, array $filters = [], int $page = 1, int $perPage = 10): LengthAwarePaginator;

    /**
     * Every ticket across the platform — the admin console list.
     *
     * @param  array<string, mixed>  $filters
     */
    public function paginateAll(array $filters = [], int $page = 1, int $perPage = 15): LengthAwarePaginator;

    /** Move a ticket to a new status (admin action). */
    public function updateStatus(SupportTicket $ticket, string $status): SupportTicket;

    /** Aggregate counts by status for the admin stat cards. */
    public function statusCounts(): array;
}
