<?php

namespace App\Services\Support;

use App\Contracts\Support\SupportTicketServiceInterface;
use App\Enums\TicketSourceEnum;
use App\Enums\TicketStatusEnum;
use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class SupportTicketService implements SupportTicketServiceInterface
{
    public function create(User $user, TicketSourceEnum $source, array $data): SupportTicket
    {
        // Restaurant tickets pin the partner's branch; customer tickets leave it null.
        $restaurantId = $source === TicketSourceEnum::RESTAURANT
            ? $user->restaurant()->value('id')
            : null;

        return SupportTicket::create([
            'user_id' => $user->id,
            'source' => $source->value,
            'restaurant_id' => $restaurantId,
            'order_reference' => $data['order_reference'] ?? null,
            'category' => $data['category'] ?? null,
            'subject' => $data['subject'],
            'description' => $data['description'],
            'status' => TicketStatusEnum::OPEN->value,
        ]);
    }

    public function paginateForUser(User $user, array $filters = [], int $page = 1, int $perPage = 10): LengthAwarePaginator
    {
        return $this->baseQuery($filters)
            ->where('user_id', $user->id)
            ->latest()
            ->paginate(perPage: $perPage, page: $page);
    }

    public function paginateAll(array $filters = [], int $page = 1, int $perPage = 15): LengthAwarePaginator
    {
        return $this->baseQuery($filters)
            ->with(['user', 'restaurant'])
            ->latest()
            ->paginate(perPage: $perPage, page: $page);
    }

    public function updateStatus(SupportTicket $ticket, string $status): SupportTicket
    {
        $ticket->update([
            'status' => TicketStatusEnum::from($status)->value,
        ]);

        return $ticket->refresh();
    }

    public function statusCounts(): array
    {
        $counts = SupportTicket::query()
            ->selectRaw('status, count(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        return [
            'total' => (int) $counts->sum(),
            'open' => (int) ($counts[TicketStatusEnum::OPEN->value] ?? 0),
            'in_progress' => (int) ($counts[TicketStatusEnum::IN_PROGRESS->value] ?? 0),
            'resolved' => (int) ($counts[TicketStatusEnum::RESOLVED->value] ?? 0),
            'closed' => (int) ($counts[TicketStatusEnum::CLOSED->value] ?? 0),
        ];
    }

    /**
     * Shared filtering — status, source and a free-text search across the
     * subject / description / reference.
     *
     * @param  array<string, mixed>  $filters
     */
    protected function baseQuery(array $filters): Builder
    {
        return SupportTicket::query()
            ->when(! empty($filters['status']), fn (Builder $q) => $q->where('status', $filters['status']))
            ->when(! empty($filters['source']), fn (Builder $q) => $q->where('source', $filters['source']))
            ->when(! empty($filters['search']), function (Builder $q) use ($filters) {
                $search = $filters['search'];
                $q->where(function (Builder $inner) use ($search) {
                    $inner->where('subject', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('order_reference', 'like', "%{$search}%")
                        ->orWhere('id', 'like', "%{$search}%");
                });
            });
    }
}
