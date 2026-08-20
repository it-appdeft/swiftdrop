<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Support\SupportTicketServiceInterface;
use App\Enums\TicketSourceEnum;
use App\Enums\UserRoleEnum;
use App\Exceptions\InvalidInputException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Support\StoreSupportTicketRequest;
use App\Models\User;
use App\Support\PaginationMeta;
use App\Traits\ApiResponse;
use App\Traits\FormatsTickets;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Shared support-ticket endpoint for the mobile apps. Both customers and drivers
 * raise tickets through the same routes ("Help Center" form); the ticket source
 * is derived from the authenticated user's role. Reuses the shared
 * {@see SupportTicketServiceInterface} / {@see FormatsTickets}.
 */
class SupportTicketController extends Controller
{
    use ApiResponse;
    use FormatsTickets;

    public function __construct(
        protected SupportTicketServiceInterface $tickets,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query('page', 1));
        $perPage = max(1, min(50, (int) $request->query('per_page', 10)));

        $paginator = $this->tickets->paginateForUser(
            $request->user(),
            $request->only(['status', 'search']),
            $page,
            $perPage,
        );

        return $this->successPaginated(
            $this->ticketRows($paginator->getCollection()),
            PaginationMeta::make($paginator),
            'Support tickets retrieved.',
        );
    }

    public function store(StoreSupportTicketRequest $request): JsonResponse
    {
        $ticket = $this->tickets->create(
            $request->user(),
            $this->sourceFor($request->user()),
            $request->validated(),
        );

        return $this->success($this->ticketRow($ticket), 'Support ticket submitted.', 201);
    }

    /** Map the authenticated user's role onto the ticket source. */
    protected function sourceFor(User $user): TicketSourceEnum
    {
        return match (true) {
            $user->hasRole(UserRoleEnum::CUSTOMER->value) => TicketSourceEnum::CUSTOMER,
            $user->hasRole(UserRoleEnum::DRIVER->value) => TicketSourceEnum::DRIVER,
            $user->hasRole(UserRoleEnum::RESTAURANT_OWNER->value) => TicketSourceEnum::RESTAURANT,
            default => throw InvalidInputException::make('Your account cannot raise support tickets.', 'role'),
        };
    }
}
