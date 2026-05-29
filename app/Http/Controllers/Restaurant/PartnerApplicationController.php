<?php

namespace App\Http\Controllers\Restaurant;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Restaurant\Concerns\ManagesPartnerApplication;
use App\Http\Requests\Partner\SavePartnerApplicationRequest;
use App\Http\Requests\Partner\UploadPartnerDocumentRequest;
use App\Models\Restaurant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * 6-step partner application:
 *
 *   1. Account & Restaurant — owner identity + restaurant basics
 *                             (writes restaurants core columns)
 *   2. Location & Hours     — address + per-day operating hours
 *                             (writes restaurants address + restaurant_hours)
 *   3. Legal & Bank         — GST/FSSAI/PAN + payout account
 *                             (writes restaurant_legal_and_bank)
 *   4. Documents            — six file slots → restaurant_documents
 *   5. Menu starter         — signature dishes → restaurant_menu_items
 *   6. Review & Submit      — terms + submit → application_submitted_at
 */
class PartnerApplicationController extends Controller
{
    use ManagesPartnerApplication;

    public function show(Request $request): Response|RedirectResponse
    {
        $restaurant = $this->resolveRestaurant();

        if ($restaurant->hasSubmittedApplication()) {
            return Inertia::render('restaurant/partner/apply', [
                'completed' => true,
            ]);
        }

        return Inertia::render('restaurant/partner/apply', [
            'initialStep' => (int) ($restaurant->application_step ?? 1),
            'initialData' => $this->flattenForm($restaurant),
            'initialDocuments' => $this->documentMeta($restaurant),
            'foodTypes' => $this->foodTypeOptions(),
            'googleMapsApiKey' => config('services.google_maps.key'),
        ]);
    }

    public function save(SavePartnerApplicationRequest $request): RedirectResponse
    {
        $restaurant = $this->resolveRestaurant();
        $this->guardSubmitted($restaurant);

        $validated = $request->validated();
        $step = (int) $validated['step'];
        $data = (array) ($validated['data'] ?? []);

        match ($step) {
            1 => $this->writeAccountRestaurant($restaurant, $data),
            2 => $this->writeLocationHours($restaurant, $data),
            3 => $this->writeLegalBank($restaurant, $data),
            5 => $this->writeCategories($restaurant, $data),
            default => null, // Steps 4 (documents) and 6 (review) carry no structured data
        };

        $restaurant->forceFill([
            'application_step' => min(6, $step + 1),
        ])->save();

        return back();
    }

    public function uploadDocument(UploadPartnerDocumentRequest $request): RedirectResponse
    {
        $restaurant = $this->resolveRestaurant();
        $this->guardSubmitted($restaurant);

        $this->storeDocument($restaurant, $request->documentType(), $request->file('file'));

        return back();
    }

    public function submit(Request $request): RedirectResponse
    {
        $restaurant = $this->resolveRestaurant();

        if (! $restaurant->hasSubmittedApplication()) {
            $restaurant->forceFill([
                'application_step' => 6,
                'terms_accepted_at' => now(),
                'application_submitted_at' => now(),
            ])->save();
        }

        return redirect()->route('partner.apply');
    }

    // ─── Writers ────────────────────────────────────────────────────────────

    protected function resolveRestaurant(): Restaurant
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $restaurant = $user?->restaurant()
            ->with([
                'user',
                'legalAndBank',
                'applicationDocuments',
                'hours',
                'categories',
                'foodTypes',
            ])
            ->first();

        if (! $restaurant) {
            abort(403, 'No restaurant profile is attached to this account.');
        }

        return $restaurant;
    }

    protected function guardSubmitted(Restaurant $restaurant): void
    {
        if ($restaurant->hasSubmittedApplication()) {
            throw ValidationException::withMessages([
                'form' => 'Application already submitted.',
            ]);
        }
    }
}
