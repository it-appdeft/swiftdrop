<?php

namespace App\Http\Middleware;

use App\Enums\UserRoleEnum;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Guests: bounce to the admin login page so they can authenticate.
        if (! $user) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required.',
                ], 401);
            }

            return redirect()->guest(route('admin.login'));
        }

        // Authenticated but not an admin (customer / restaurant_owner / driver):
        // redirect them away from the admin area to their own dashboard.
        if (! $user->hasRole(UserRoleEnum::ADMIN->value)) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to access the admin area.',
                ], 403);
            }

            return redirect()
                ->route($user->homeRouteName())
                ->with('error', 'You do not have permission to access the admin area.');
        }

        return $next($request);
    }
}
