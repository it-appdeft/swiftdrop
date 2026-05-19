<?php

namespace App\Http\Controllers\Restaurant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Partner\SavePartnerApplicationRequest;
use App\Http\Requests\Partner\SubmitPartnerApplicationRequest;
use App\Http\Requests\Partner\UploadPartnerDocumentRequest;
use App\Models\Restaurant;
use App\Models\RestaurantDocument;
use App\Models\RestaurantLegalAndBank;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PartnerApplicationController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        $restaurant = $this->resolveRestaurant();

        if ($restaurant->hasSubmittedApplication()) {
            return redirect()->route('restaurant.onboarding');
        }

        return Inertia::render('restaurant/partner/apply', [
            'initialStep' => (int) ($restaurant->application_step ?? 1),
            'initialData' => $this->flattenForm($restaurant),
            'initialDocuments' => $this->documentMeta($restaurant),
        ]);
    }

    public function save(SavePartnerApplicationRequest $request): RedirectResponse
    {
        $restaurant = $this->resolveRestaurant();

        if ($restaurant->hasSubmittedApplication()) {
            throw ValidationException::withMessages([
                'form' => 'Application already submitted.',
            ]);
        }

        $validated = $request->validated();
        // `step` here is the step whose data is in the payload — i.e. the step
        // the user is *leaving* by clicking Continue. The controller writes
        // that step's columns and then advances the resume cursor by one so a
        // reload lands the user on the next step's form.
        $step = (int) $validated['step'];
        $data = (array) ($validated['data'] ?? []);

        match ($step) {
            1 => $this->writeStep1($restaurant, $data),
            2 => $this->writeStep2($restaurant, $data),
            default => null,
        };

        $restaurant->forceFill([
            'application_step' => min(4, $step + 1),
        ])->save();

        return back();
    }

    public function uploadDocument(UploadPartnerDocumentRequest $request): RedirectResponse
    {
        $restaurant = $this->resolveRestaurant();

        if ($restaurant->hasSubmittedApplication()) {
            throw ValidationException::withMessages([
                'document' => 'Application already submitted.',
            ]);
        }

        $column = RestaurantDocument::TYPE_TO_COLUMN[$request->documentType()];

        $path = $request->file('file')->store(
            "partner-applications/{$restaurant->id}",
            'public',
        );

        RestaurantDocument::updateOrCreate(
            ['restaurant_id' => $restaurant->id],
            [$column => $path],
        );

        return back();
    }

    public function submit(SubmitPartnerApplicationRequest $request): RedirectResponse
    {
        $restaurant = $this->resolveRestaurant();

        if ($restaurant->hasSubmittedApplication()) {
            return redirect()->route('restaurant.onboarding');
        }

        $data = (array) ($request->validated()['data'] ?? []);

        // Step 1 + Step 2 may have been edited and reconfirmed at submit time
        // — persist any final tweaks before we lock the application.
        $this->writeStep1($restaurant, $data);
        $this->writeStep2($restaurant, $data);

        $restaurant->forceFill([
            'application_step' => 4,
            'terms_accepted_at' => now(),
            'application_submitted_at' => now(),
        ])->save();

        return redirect()->route('restaurant.onboarding');
    }

    // ─── Internal: read/write helpers ───────────────────────────────────────

    /**
     * Map the 3 normalized tables back to the flat shape the form uses, so the
     * frontend doesn't need to know about the schema split.
     */
    protected function flattenForm(Restaurant $restaurant): array
    {
        $legal = $restaurant->legalAndBank ?? new RestaurantLegalAndBank();
        $user = $restaurant->user;

        // Email and mobile are captured at registration on the User record.
        // Prefer the restaurant's owner_* override if it's been edited later;
        // otherwise fall back to the registered user's contact info so the
        // form always shows the value the partner typed during signup.
        $email = $restaurant->owner_email ?: ($user->email ?? '');
        $mobile = $restaurant->owner_mobile ?: ($user->mobile ?? '');

        return [
            // Step 1
            'restaurantName' => (string) ($restaurant->name ?? ''),
            'legalName' => (string) ($restaurant->legal_business_name ?? ''),
            'ownerName' => (string) ($restaurant->owner_name ?? ''),
            'mobile' => (string) $mobile,
            'email' => (string) $email,
            'restaurantType' => (string) ($restaurant->restaurant_type ?? ''),
            'cuisines' => (string) ($restaurant->cuisines ?? ''),
            'branches' => $restaurant->branches !== null ? (string) $restaurant->branches : '',
            'seating' => $restaurant->seating_capacity !== null ? (string) $restaurant->seating_capacity : '',
            'fullAddress' => (string) ($restaurant->full_address ?? ''),
            // Step 2
            'gst' => (string) ($legal->gst_number ?? ''),
            'fssai' => (string) ($legal->fssai_license ?? ''),
            'pan' => (string) ($legal->pan_number ?? ''),
            'accountHolder' => (string) ($legal->account_holder_name ?? ''),
            'bankName' => (string) ($legal->bank_name ?? ''),
            'accountNumber' => (string) ($legal->account_number ?? ''),
            'ifsc' => (string) ($legal->ifsc_code ?? ''),
            // Step 4
            'termsAccepted' => $restaurant->terms_accepted_at !== null,
        ];
    }

    protected function writeStep1(Restaurant $restaurant, array $data): void
    {
        $restaurant->fill(array_filter([
            'name' => $data['restaurantName'] ?? null,
            'legal_business_name' => $data['legalName'] ?? null,
            'owner_name' => $data['ownerName'] ?? null,
            'owner_mobile' => $data['mobile'] ?? null,
            'owner_email' => $data['email'] ?? null,
            'restaurant_type' => $data['restaurantType'] ?? null,
            'cuisines' => $data['cuisines'] ?? null,
            'branches' => isset($data['branches']) && $data['branches'] !== '' ? (int) $data['branches'] : null,
            'seating_capacity' => isset($data['seating']) && $data['seating'] !== '' ? (int) $data['seating'] : null,
            'full_address' => $data['fullAddress'] ?? null,
        ], fn ($v) => $v !== null))->save();
    }

    protected function writeStep2(Restaurant $restaurant, array $data): void
    {
        $payload = array_filter([
            'gst_number' => $data['gst'] ?? null,
            'fssai_license' => $data['fssai'] ?? null,
            'pan_number' => $data['pan'] ?? null,
            'account_holder_name' => $data['accountHolder'] ?? null,
            'bank_name' => $data['bankName'] ?? null,
            'account_number' => $data['accountNumber'] ?? null,
            'ifsc_code' => $data['ifsc'] ?? null,
        ], fn ($v) => $v !== null);

        if (empty($payload)) {
            return;
        }

        RestaurantLegalAndBank::updateOrCreate(
            ['restaurant_id' => $restaurant->id],
            $payload,
        );
    }

    protected function resolveRestaurant(): Restaurant
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $restaurant = $user?->restaurant()
            ->with(['user', 'legalAndBank', 'applicationDocuments'])
            ->first();

        if (! $restaurant) {
            abort(403, 'No restaurant profile is attached to this account.');
        }

        return $restaurant;
    }

    /**
     * Surface which document slots are already filled (path stored). The
     * frontend uses the slot key to render an "uploaded" hint; the path itself
     * is intentionally not leaked.
     */
    protected function documentMeta(Restaurant $restaurant): array
    {
        $row = $restaurant->applicationDocuments;
        $out = [];

        foreach (RestaurantDocument::TYPE_TO_COLUMN as $key => $column) {
            $out[$key] = $row && filled($row->{$column}) ? ['uploaded' => true] : null;
        }

        return $out;
    }
}
