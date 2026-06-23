<?php

namespace App\Traits;

use App\Models\SupportTicket;
use Illuminate\Support\Collection;

/**
 * Shared serialization for support tickets. Used by every controller that
 * surfaces a ticket — customer API, restaurant Support page and the admin
 * console — so the JSON / Inertia shape is identical everywhere.
 */
trait FormatsTickets
{
    /** @return array<int, array<string, mixed>> */
    protected function ticketRows(Collection $tickets): array
    {
        return $tickets->map(fn (SupportTicket $ticket) => $this->ticketRow($ticket))->values()->all();
    }

    /** @return array<string, mixed> */
    protected function ticketRow(SupportTicket $ticket): array
    {
        return [
            'id' => $ticket->id,
            'reference' => $ticket->reference,
            'source' => $ticket->source->value,
            'subject' => $ticket->subject,
            'category' => $ticket->category,
            'order_reference' => $ticket->order_reference,
            'description' => $ticket->description,
            'status' => $ticket->status->value,
            'status_label' => $ticket->status->label(),
            // Eager-loaded on the admin list; absent elsewhere (relations stay lazy).
            'customer_name' => $ticket->relationLoaded('user') ? $ticket->user?->name : null,
            'restaurant_name' => $ticket->relationLoaded('restaurant') ? $ticket->restaurant?->name : null,
            'created_at' => optional($ticket->created_at)->toIso8601String(),
            'updated_at' => optional($ticket->updated_at)->toIso8601String(),
        ];
    }
}
