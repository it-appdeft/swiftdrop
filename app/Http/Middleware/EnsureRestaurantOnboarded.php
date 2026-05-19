<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gate restaurant dashboard routes behind a submitted partner application.
 * Partners who started but haven't completed all six steps get bounced back
 * to /partner/apply so they finish onboarding before seeing the dashboard.
 *
 * Pair with {@see EnsureIsRestaurant} — this middleware assumes the user is
 * already a restaurant owner and a `restaurant` profile is attached.
 */
class EnsureRestaurantOnboarded
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $restaurant = $user?->restaurant;

        if (! $restaurant || ! $restaurant->hasSubmittedApplication()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Finish your partner application to access the dashboard.',
                ], 403);
            }

            return redirect()
                ->route('partner.apply')
                ->with('error', 'Finish your partner application to access the dashboard.');
        }

        return $next($request);
    }
}
