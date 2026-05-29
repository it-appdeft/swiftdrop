<?php

namespace App\Http\Controllers\Restaurant;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Restaurant\Concerns\ManagesPartnerApplication;
use App\Http\Requests\Partner\SavePartnerApplicationRequest;
use App\Http\Requests\Partner\UploadPartnerDocumentRequest;
use App\Models\Restaurant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Restaurant-owner settings page (Profile / Restaurant / Notifications /
 * Security tabs). The Restaurant tab lets the partner manage everything
 * captured during onboarding — identity, location & hours, legal & bank,
 * documents and categories — after the application has been submitted.
 *
 * The actual persistence reuses {@see ManagesPartnerApplication} so the
 * field mapping never drifts from the onboarding wizard. Unlike the wizard
 * these endpoints don't gate on submission or advance the step cursor.
 */
class SettingsController extends Controller
{
    use ManagesPartnerApplication;

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
            // Full onboarding snapshot for the Restaurant tab's sub-sections.
            'application' => $restaurant ? $this->flattenForm($restaurant) : null,
            'documents' => $restaurant ? $this->documentMeta($restaurant) : [],
            'foodItems' => $this->foodItemOptions(),
            'googleMapsApiKey' => config('services.google_maps.key'),
        ]);
    }

    public function updateProfile(Request $request): RedirectResponse
    {
        $restaurant = $this->restaurantForOrFail($request);

        $validated = $request->validate([
            'ownerName' => ['required', 'string', 'max:100'],
        ]);

        $restaurant->forceFill([
            'owner_name' => $validated['ownerName'],
        ])->save();

        return back();
    }

    /**
     * Persist one onboarding section (step 1/2/3/5). Mirrors the wizard's
     * per-step save but without the submit-guard or step-advance, so partners
     * can edit their details any time after going live.
     */
    public function updateSection(SavePartnerApplicationRequest $request): RedirectResponse
    {
        $restaurant = $this->restaurantForOrFail($request);

        $validated = $request->validated();
        $step = (int) $validated['step'];
        $data = (array) ($validated['data'] ?? []);

        match ($step) {
            1 => $this->writeAccountRestaurant($restaurant, $data),
            2 => $this->writeLocationHours($restaurant, $data),
            3 => $this->writeLegalBank($restaurant, $data),
            5 => $this->writeCategories($restaurant, $data),
            default => null,
        };

        return back()->with('status', 'Changes saved.');
    }

    public function uploadDocument(UploadPartnerDocumentRequest $request): RedirectResponse
    {
        $restaurant = $this->restaurantForOrFail($request);

        $this->storeDocument($restaurant, $request->documentType(), $request->file('file'));

        return back()->with('status', 'Document updated.');
    }

    protected function restaurantFor(?\App\Models\User $user): ?Restaurant
    {
        if (! $user) {
            return null;
        }

        return $user->restaurant()
            ->with(['user', 'legalAndBank', 'applicationDocuments', 'hours', 'categories', 'foodItems'])
            ->first();
    }

    protected function restaurantForOrFail(Request $request): Restaurant
    {
        $restaurant = $this->restaurantFor($request->user());
        abort_unless($restaurant !== null, 403, 'No restaurant profile attached to this account.');

        return $restaurant;
    }
}
