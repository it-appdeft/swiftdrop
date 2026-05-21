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
            ],
            // Surface one-shot session flashes so the frontend can fire a
            // toast on the next visit (see app.tsx → router.on('success')).
            'flash' => [
                'status' => fn () => $request->session()->get('status'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ]);
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
