<?php

namespace App\Http\Controllers\Restaurant;

use App\Contracts\Support\SupportTicketServiceInterface;
use App\Enums\TicketSourceEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\Support\StoreRestaurantTicketRequest;
use App\Traits\FormatsTickets;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Restaurant Support page: contact channels + "Raise a ticket" form, plus the
 * partner's own recent tickets. Backed by the shared
 * {@see SupportTicketServiceInterface} / {@see FormatsTickets}.
 */
class SupportController extends Controller
{
    use FormatsTickets;

    public function __construct(
        protected SupportTicketServiceInterface $tickets,
    ) {
    }

    public function index(Request $request): Response
    {
        $paginator = $this->tickets->paginateForUser($request->user(), $request->only(['status']), 1, 20);

        return Inertia::render('restaurant/support', [
            'tickets' => $this->ticketRows($paginator->getCollection()),
            'contact' => [
                'phone' => '1800-123-456',
                'email' => 'partners@swiftdrop.app',
                'live_chat_response' => 'Avg response 2 min',
            ],
            'categories' => ['Order', 'Payout', 'Menu', 'Other'],
        ]);
    }

    public function store(StoreRestaurantTicketRequest $request): RedirectResponse
    {
        $this->tickets->create(
            $request->user(),
            TicketSourceEnum::RESTAURANT,
            $request->validated(),
        );

        return back()->with('success', 'Ticket submitted. Our partner team will be in touch shortly.');
    }
}
