<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRoleEnum;
use App\Exceptions\InvalidInputException;
use App\Http\Controllers\Controller;
use App\Http\Resources\DeletionReasonResource;
use App\Models\DeletionReason;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeletionReasonController extends Controller
{
    use ApiResponse;

    /**
     * Lookup list used by the customer / driver / restaurant apps to
     * populate the "Why are you leaving?" reason picker on the delete
     * account screen. Admin-managed via the deletion_reasons table.
     */
    public function index(Request $request): JsonResponse
    {
        $role = $this->resolveRole($request);

        $reasons = DeletionReason::query()
            ->active()
            ->forRole($role)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return $this->success(
            data: DeletionReasonResource::collection($reasons),
            message: 'Deletion reasons retrieved.',
        );
    }

    /**
     * Prefer the authenticated user's role; fall back to ?role= for the
     * pre-auth / debugging case. Validates against UserRoleEnum so an
     * arbitrary string can't probe other roles.
     */
    protected function resolveRole(Request $request): string
    {
        $authUser = auth('sanctum')->user();

        if ($authUser) {
            foreach ([UserRoleEnum::CUSTOMER, UserRoleEnum::DRIVER, UserRoleEnum::RESTAURANT_OWNER] as $role) {
                if ($authUser->hasRole($role->value)) {
                    return $role->value;
                }
            }
        }

        $requested = (string) $request->query('role', '');
        $role = UserRoleEnum::tryFrom($requested);

        if (! $role || $role === UserRoleEnum::ADMIN) {
            throw InvalidInputException::make('A valid role is required.', 'role');
        }

        return $role->value;
    }
}
