<?php

namespace App\Http\Controllers\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Restaurant > Dashboard. Approval + accepting-orders state reaches the page
 * through the shared `auth.restaurant` Inertia prop (see HandleInertiaRequests),
 * so the page render stays a thin shell.
 */
class DashboardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('restaurant/dashboard');
    }

    /**
     * Toggle the partner's "accepting orders" switch. Hard-gated on approval:
     * an unapproved restaurant can never flip this on, regardless of what the
     * client sends, so it can't take orders before admin sign-off.
     */
    public function toggleAcceptingOrders(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'is_accepting_orders' => ['required', 'boolean'],
        ]);

        $restaurant = $this->restaurantFor($request->user());
        abort_unless($restaurant !== null, 403, 'No restaurant profile attached to this account.');

        if (! $restaurant->isApproved()) {
            return back()->with('error', 'Your restaurant must be approved before you can accept orders.');
        }

        $restaurant->update(['is_accepting_orders' => $data['is_accepting_orders']]);

        // No flash here — the header toggle fires a richer two-line toast
        // client-side (title + detail) on success.
        return back();
    }

    protected function restaurantFor(?\App\Models\User $user): ?Restaurant
    {
        return $user?->restaurant()->first();
    }
}
