<?php

namespace App\Http\Controllers\Restaurant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Partner\SavePartnerApplicationRequest;
use App\Http\Requests\Partner\UploadPartnerDocumentRequest;
use App\Models\Restaurant;
use App\Models\RestaurantDocument;
use App\Models\RestaurantHour;
use App\Models\RestaurantLegalAndBank;
use App\Models\RestaurantMenuItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
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
            5 => $this->writeMenuItems($restaurant, $data),
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

        $column = RestaurantDocument::TYPE_TO_COLUMN[$request->documentType()];

        $path = $request->file('file')->store(
            "partner-applications/{$restaurant->id}",
            'public',
        );

        $existing = $restaurant->applicationDocuments;
        if ($existing && $existing->{$column}) {
            $this->replaceFile($existing->{$column}, $path);
        }

        RestaurantDocument::updateOrCreate(
            ['restaurant_id' => $restaurant->id],
            [$column => $path],
        );

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

    protected function writeAccountRestaurant(Restaurant $restaurant, array $data): void
    {
        // Mirror the verified email + mobile from the auth user onto the
        // restaurant snapshot. The UI shows them as read-only — never trust
        // the client payload for these.
        $user = $restaurant->user;

        $restaurant->fill(array_filter([
            'owner_name' => $data['ownerName'] ?? null,
            'owner_email' => $user?->email,
            'owner_mobile' => $user?->mobile,
            'name' => $data['restaurantName'] ?? null,
            'legal_business_name' => $data['legalName'] ?? null,
            'restaurant_type' => $data['restaurantType'] ?? null,
            'cuisines' => $data['cuisines'] ?? null,
            'branches' => isset($data['branches']) && $data['branches'] !== ''
                ? (int) $data['branches'] : null,
            'seating_capacity' => isset($data['seating']) && $data['seating'] !== ''
                ? (int) $data['seating'] : null,
        ], fn ($v) => $v !== null && $v !== ''))->save();
    }

    protected function writeLocationHours(Restaurant $restaurant, array $data): void
    {
        $restaurant->fill(array_filter([
            'full_address' => $data['fullAddress'] ?? null,
            'city' => $data['city'] ?? null,
            'pin_code' => $data['pinCode'] ?? null,
        ], fn ($v) => $v !== null && $v !== ''))->save();

        $hours = (array) ($data['hours'] ?? []);

        foreach (RestaurantHour::DAYS as $day) {
            $row = $hours[$day] ?? null;
            if (! is_array($row)) {
                continue;
            }

            RestaurantHour::updateOrCreate(
                ['restaurant_id' => $restaurant->id, 'day_of_week' => $day],
                [
                    'is_open' => (bool) ($row['open'] ?? false),
                    'open_from' => $row['from'] ?? null,
                    'open_to' => $row['to'] ?? null,
                ],
            );
        }
    }

    protected function writeLegalBank(Restaurant $restaurant, array $data): void
    {
        $payload = array_filter([
            'gst_number' => $data['gst'] ?? null,
            'fssai_license' => $data['fssai'] ?? null,
            'pan_number' => $data['pan'] ?? null,
            'account_holder_name' => $data['bankAccountHolder'] ?? null,
            'bank_name' => $data['bankName'] ?? null,
            'account_number' => $data['accountNumber'] ?? null,
            'ifsc_code' => $data['ifsc'] ?? null,
        ], fn ($v) => $v !== null && $v !== '');

        if (! empty($payload)) {
            RestaurantLegalAndBank::updateOrCreate(
                ['restaurant_id' => $restaurant->id],
                $payload,
            );
        }
    }

    protected function writeMenuItems(Restaurant $restaurant, array $data): void
    {
        $items = (array) ($data['menuItems'] ?? []);

        // Replace-all is simpler than diffing — the starter list is tiny
        // (UI caps at 50) and the rows have no foreign-key dependents.
        RestaurantMenuItem::where('restaurant_id', $restaurant->id)->delete();

        foreach (array_values($items) as $idx => $row) {
            if (! is_array($row)) {
                continue;
            }

            $name = trim((string) ($row['name'] ?? ''));
            if ($name === '') {
                continue; // Skip blank rows the user left empty
            }

            RestaurantMenuItem::create([
                'restaurant_id' => $restaurant->id,
                'name' => $name,
                'price' => isset($row['price']) && $row['price'] !== ''
                    ? (float) $row['price'] : null,
                'diet' => in_array($row['diet'] ?? null, RestaurantMenuItem::DIETS, true)
                    ? $row['diet'] : 'veg',
                'sort_order' => $idx,
            ]);
        }
    }

    // ─── Read helpers ───────────────────────────────────────────────────────

    protected function flattenForm(Restaurant $restaurant): array
    {
        $legal = $restaurant->legalAndBank ?? new RestaurantLegalAndBank();

        $hours = [];
        foreach (RestaurantHour::DAYS as $day) {
            $row = $restaurant->hours->firstWhere('day_of_week', $day);
            $hours[$day] = [
                'open' => $row?->is_open ?? ($day !== 'tue'),
                'from' => $row?->open_from ? substr($row->open_from, 0, 5) : '11:00',
                'to' => $row?->open_to ? substr($row->open_to, 0, 5) : '23:00',
            ];
        }

        $menuItems = $restaurant->starterMenuItems->map(fn ($item) => [
            'name' => (string) $item->name,
            'price' => $item->price !== null ? (string) $item->price : '',
            'diet' => $item->diet ?: 'veg',
        ])->values()->all();

        return [
            // Step 1 — Account & Restaurant. Email + mobile + country code are
            // sourced from the authenticated user (verified at registration) and
            // surfaced read-only in the UI.
            'ownerName' => (string) ($restaurant->owner_name ?? ''),
            'contactEmail' => (string) ($restaurant->user?->email ?? $restaurant->owner_email ?? ''),
            'contactCountryCode' => (string) ($restaurant->user?->country_code ?? '+44'),
            'contactPhone' => (string) ($restaurant->user?->mobile ?? $restaurant->owner_mobile ?? ''),
            'restaurantName' => (string) ($restaurant->name ?? ''),
            'legalName' => (string) ($restaurant->legal_business_name ?? ''),
            'restaurantType' => (string) ($restaurant->restaurant_type ?? ''),
            'cuisines' => (string) ($restaurant->cuisines ?? ''),
            'branches' => $restaurant->branches !== null ? (string) $restaurant->branches : '',
            'seating' => $restaurant->seating_capacity !== null ? (string) $restaurant->seating_capacity : '',
            // Step 2 — Location & Hours
            'fullAddress' => (string) ($restaurant->full_address ?? ''),
            'city' => (string) ($restaurant->city ?? ''),
            'pinCode' => (string) ($restaurant->pin_code ?? ''),
            'hours' => $hours,
            // Step 3 — Legal & Bank
            'gst' => (string) ($legal->gst_number ?? ''),
            'fssai' => (string) ($legal->fssai_license ?? ''),
            'pan' => (string) ($legal->pan_number ?? ''),
            'bankAccountHolder' => (string) ($legal->account_holder_name ?? ''),
            'bankName' => (string) ($legal->bank_name ?? ''),
            'accountNumber' => (string) ($legal->account_number ?? ''),
            'ifsc' => (string) ($legal->ifsc_code ?? ''),
            // Step 5 — Menu starter
            'menuItems' => $menuItems,
        ];
    }

    protected function documentMeta(Restaurant $restaurant): array
    {
        $row = $restaurant->applicationDocuments;
        $out = [];

        foreach (RestaurantDocument::TYPE_TO_COLUMN as $key => $column) {
            $out[$key] = $row && filled($row->{$column}) ? ['uploaded' => true] : null;
        }

        return $out;
    }

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
                'starterMenuItems',
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

    protected function replaceFile(?string $oldPath, string $newPath): void
    {
        if ($oldPath && $oldPath !== $newPath && Storage::disk('public')->exists($oldPath)) {
            Storage::disk('public')->delete($oldPath);
        }
    }
}
