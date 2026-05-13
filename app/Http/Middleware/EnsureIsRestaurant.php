<?php

namespace App\Http\Middleware;

use App\Enums\UserRoleEnum;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsRestaurant
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required.',
                ], 401);
            }

            return redirect()->guest(route('login'));
        }

        if (! $user->hasRole(UserRoleEnum::RESTAURANT_OWNER->value)) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'This area is for restaurant partner accounts only.',
                ], 403);
            }

            return redirect()
                ->route($user->homeRouteName())
                ->with('error', 'This area is for restaurant partner accounts only.');
        }

        return $next($request);
    }
}
