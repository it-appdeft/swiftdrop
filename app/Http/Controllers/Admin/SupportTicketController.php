<?php

namespace App\Http\Controllers\Admin;

use App\Contracts\Support\SupportTicketServiceInterface;
use App\Enums\TicketStatusEnum;
use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Traits\FormatsTickets;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Admin console view over every support ticket — customer and restaurant alike.
 * Lists, filters and lets an admin move a ticket through its lifecycle. Reuses
 * the shared {@see SupportTicketServiceInterface} / {@see FormatsTickets}.
 */
class SupportTicketController extends Controller
{
    use FormatsTickets;

    public function __construct(
        protected SupportTicketServiceInterface $tickets,
    ) {
    }

    public function index(Request $request): Response
    {
        $page = max(1, (int) $request->query('page', 1));
        $filters = $request->only(['search', 'status', 'source']);

        $paginator = $this->tickets->paginateAll($filters, $page, 15)->withQueryString();

        return Inertia::render('admin/support-tickets/index', [
            'tickets' => [
                'data' => $this->ticketRows($paginator->getCollection()),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
                'links' => $paginator->linkCollection(),
            ],
            'filters' => $filters,
            'stats' => $this->tickets->statusCounts(),
            'statuses' => TicketStatusEnum::values(),
        ]);
    }

    public function updateStatus(Request $request, SupportTicket $ticket): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:'.implode(',', TicketStatusEnum::values())],
        ]);

        $this->tickets->updateStatus($ticket, $validated['status']);

        return back()->with('success', 'Ticket status updated.');
    }
}
