<?php

namespace App\Http\Controllers\Web\Customer;

use App\Contracts\Support\SupportTicketServiceInterface;
use App\Enums\TicketSourceEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\Support\StoreCustomerTicketRequest;
use Illuminate\Http\RedirectResponse;

/**
 * Customer "Report An Issue" form on the profile page (Help tab). Submits via
 * Inertia and redirects back with a flash message; the heavy lifting lives in
 * the shared {@see SupportTicketServiceInterface}.
 *
 * @see \App\Http\Controllers\Api\SupportTicketController shared mobile API (customer + driver)
 */
class SupportTicketController extends Controller
{
    public function __construct(
        protected SupportTicketServiceInterface $tickets,
    ) {
    }

    public function store(StoreCustomerTicketRequest $request): RedirectResponse
    {
        $this->tickets->create(
            $request->user(),
            TicketSourceEnum::CUSTOMER,
            $request->validated(),
        );

        return back()->with('success', "Thanks! We've received your issue and will get back to you soon.");
    }
}
