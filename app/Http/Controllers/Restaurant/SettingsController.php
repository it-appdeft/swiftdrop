<?php

namespace App\Http\Controllers\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Restaurant-owner settings page (Profile / Restaurant / Notifications /
 * Security / Billing tabs). For now this controller only persists the
 * Profile tab — the other tabs are local UI state until their backend
 * endpoints are added.
 */
class SettingsController extends Controller
{
    public function show(Request $request): Response
    {
        $user = $request->user();
        $restaurant = $this->restaurantFor($user);

        return Inertia::render('restaurant/settings', [
            'profile' => [
                // Personal info displayed in the form. `ownerName` is the
                // editable field; email + mobile + countryCode are read-only
                // (OTP-verified at signup, separate flow required to change).
                'ownerName' => (string) ($restaurant?->owner_name ?? ''),
                'email' => (string) ($user?->email ?? ''),
                'countryCode' => (string) ($user?->country_code ?? '+44'),
                'mobile' => (string) ($user?->mobile ?? ''),
                'role' => 'Owner',
            ],
        ]);
    }

    public function updateProfile(Request $request): RedirectResponse
    {
        $user = $request->user();
        $restaurant = $this->restaurantFor($user);

        abort_unless($restaurant !== null, 403, 'No restaurant profile attached to this account.');

        $validated = $request->validate([
            'ownerName' => ['required', 'string', 'max:100'],
        ]);

        $restaurant->forceFill([
            'owner_name' => $validated['ownerName'],
        ])->save();

        return back();
    }

    protected function restaurantFor(?\App\Models\User $user): ?Restaurant
    {
        if (! $user) {
            return null;
        }

        return $user->restaurant()->first();
    }
}
