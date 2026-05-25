<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $user = $request->user()?->loadProfileRelation();

        return array_merge(parent::share($request), [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $user,
                // Role-specific landing URL for header / post-auth redirects.
                'home_url' => $user ? route($user->homeRouteName()) : null,
                // Customer-only: the address driving all radius-aware queries.
                // Header chip + dashboard banner read this. Falls back through
                // selected → default → newest so single-address customers are
                // always represented.
                'selected_address' => fn () => $this->customerSelectedAddress($user),
                // Restaurant-owner only: approval + accepting-orders state that
                // drives the dashboard banner and the header "Accepting orders"
                // toggle (which stays disabled until admin approval lands).
                'restaurant' => fn () => $this->restaurantState($user),
            ],
            // Lightweight cart badge for the header — just the total item
            // count. The full cart payload is delivered per-page (restaurant
            // detail) or via the cart endpoint.
            'cart_summary' => fn () => $this->customerCartSummary($user),
            // Saved addresses for the header's "change address" map flow.
            'customer_addresses' => fn () => $this->customerAddresses($user),
            // Surface one-shot session flashes so the frontend can fire a
            // toast on the next visit (see app.tsx → router.on('success')).
            // Both keys are forwarded: customer controllers flash `status`,
            // admin/partner controllers flash `success` — the frontend toasts
            // either one (see app.tsx).
            'flash' => [
                'status' => fn () => $request->session()->get('status'),
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ]);
    }

    protected function restaurantState(mixed $user): ?array
    {
        // loadProfileRelation() eager-loads `restaurant` for owners only, so
        // gate on the loaded relation to avoid a stray query for other roles.
        $restaurant = $user?->relationLoaded('restaurant') ? $user->restaurant : null;
        if (! $restaurant) {
            return null;
        }

        return [
            'id' => $restaurant->id,
            'name' => $restaurant->name,
            'status' => $restaurant->status,
            'approval_status' => $restaurant->approval_status,
            'is_accepting_orders' => (bool) $restaurant->is_accepting_orders,
        ];
    }

    /**
     * Saved addresses for the header map flow's "Saved Addresses" list.
     * Minimal shape — selecting one only needs its id; lat/lng stay server-side.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function customerAddresses(mixed $user): array
    {
        $profile = $user?->customerProfile ?? null;
        if (! $profile) {
            return [];
        }

        return $profile->addresses()
            ->orderByDesc('is_selected')
            ->orderByDesc('is_default')
            ->orderByDesc('id')
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'label' => $a->label,
                'address_line_1' => $a->address_line_1,
                'city' => $a->city,
                'postcode' => $a->postcode,
                'is_selected' => (bool) $a->is_selected,
            ])
            ->all();
    }

    /** @return array{item_count: int} */
    protected function customerCartSummary(mixed $user): array
    {
        $cart = $user?->cart;

        return [
            'item_count' => $cart ? (int) $cart->items()->sum('quantity') : 0,
        ];
    }

    protected function customerSelectedAddress(mixed $user): ?array
    {
        $profile = $user?->customerProfile ?? null;
        if (! $profile) {
            return null;
        }

        $address = $profile->selectedAddress()->first()
            ?? $profile->defaultAddress()->first()
            ?? $profile->addresses()->latest('id')->first();

        if (! $address) {
            return null;
        }

        return [
            'id' => $address->id,
            'label' => $address->label,
            'address_line_1' => $address->address_line_1,
            'city' => $address->city,
            'postcode' => $address->postcode,
        ];
    }
}
