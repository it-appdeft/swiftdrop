<?php

namespace App\Http\Controllers\Restaurant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Onboarding\SaveOnboardingRequest;
use App\Http\Requests\Onboarding\UploadOnboardingDocumentRequest;
use App\Http\Requests\Onboarding\UploadOnboardingImageRequest;
use App\Models\Restaurant;
use App\Models\RestaurantDeliverySettings;
use App\Models\RestaurantDocument;
use App\Models\RestaurantGalleryImage;
use App\Models\RestaurantHour;
use App\Models\RestaurantLegalAndBank;
use App\Models\RestaurantServiceSettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        $restaurant = $this->resolveRestaurant();

        if (! $restaurant->hasSubmittedApplication()) {
            return redirect()->route('partner.apply');
        }

        if ($restaurant->hasCompletedOnboarding()) {
            return redirect()->route('restaurant.dashboard');
        }

        return Inertia::render('restaurant/onboarding/setup', [
            'initialStep' => (int) ($restaurant->onboarding_step ?? 1),
            'initialData' => $this->flattenForm($restaurant),
            'initialImages' => $this->imageMeta($restaurant),
            'initialDocuments' => $this->documentMeta($restaurant),
        ]);
    }

    public function save(SaveOnboardingRequest $request): RedirectResponse
    {
        $restaurant = $this->resolveRestaurant();
        $this->guardCompleted($restaurant);

        $validated = $request->validated();
        $step = (int) $validated['step'];
        $data = (array) ($validated['data'] ?? []);

        match ($step) {
            1 => $this->writeBasicInfo($restaurant, $data),
            3 => $this->writeServiceSettings($restaurant, $data),
            4 => $this->writeHours($restaurant, $data),
            5 => $this->writeDeliverySettings($restaurant, $data),
            6 => $this->writeBank($restaurant, $data),
            7 => $this->writeTax($restaurant, $data),
            default => null, // step 2 (images) + step 8 (review) have no data
        };

        $restaurant->forceFill([
            'onboarding_step' => min(8, $step + 1),
        ])->save();

        return back();
    }

    public function uploadImage(UploadOnboardingImageRequest $request): RedirectResponse
    {
        $restaurant = $this->resolveRestaurant();
        $this->guardCompleted($restaurant);

        $type = $request->imageType();
        $path = $request->file('file')->store(
            "onboarding/{$restaurant->id}",
            'public',
        );

        if ($type === 'logo') {
            $this->replaceFile($restaurant->logo_path, $path);
            $restaurant->forceFill(['logo_path' => $path])->save();
        } elseif ($type === 'cover') {
            $this->replaceFile($restaurant->cover_photo_path, $path);
            $restaurant->forceFill(['cover_photo_path' => $path])->save();
        } else {
            $idx = $request->galleryIndex() ?? 0;

            $existing = RestaurantGalleryImage::query()
                ->where('restaurant_id', $restaurant->id)
                ->where('sort_order', $idx)
                ->first();

            if ($existing) {
                $this->replaceFile($existing->image_path, $path);
                $existing->update(['image_path' => $path]);
            } else {
                RestaurantGalleryImage::create([
                    'restaurant_id' => $restaurant->id,
                    'image_path' => $path,
                    'sort_order' => $idx,
                ]);
            }
        }

        return back();
    }

    public function uploadDocument(UploadOnboardingDocumentRequest $request): RedirectResponse
    {
        $restaurant = $this->resolveRestaurant();
        $this->guardCompleted($restaurant);

        $column = RestaurantDocument::TYPE_TO_COLUMN[$request->documentType()];

        $path = $request->file('file')->store(
            "onboarding/{$restaurant->id}",
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

        if ($restaurant->hasCompletedOnboarding()) {
            return redirect()->route('restaurant.dashboard');
        }

        $restaurant->forceFill([
            'onboarding_step' => 8,
            'onboarding_completed_at' => now(),
        ])->save();

        return redirect()->route('restaurant.dashboard');
    }

    // ─── Writers (one per step that has structured data) ───────────────────

    protected function writeBasicInfo(Restaurant $restaurant, array $data): void
    {
        $restaurant->fill(array_filter([
            'name' => $data['displayName'] ?? null,
            'tagline' => $data['tagline'] ?? null,
            'description' => $data['description'] ?? null,
            'owner_email' => $data['contactEmail'] ?? null,
            'owner_mobile' => $data['contactPhone'] ?? null,
            'full_address' => $data['address'] ?? null,
        ], fn ($v) => $v !== null))->save();
    }

    protected function writeServiceSettings(Restaurant $restaurant, array $data): void
    {
        if (isset($data['cuisines']) && is_array($data['cuisines'])) {
            $restaurant->forceFill([
                'cuisines' => implode(', ', $data['cuisines']),
            ])->save();
        }

        $payload = array_filter([
            'delivery_radius_km' => $data['deliveryRadius'] ?? null,
            'avg_prep_time_min' => $data['avgPrepTime'] ?? null,
            'min_order_amount' => $data['minOrderAmount'] ?? null,
            'avg_ticket_size' => $data['avgTicketSize'] ?? null,
        ], fn ($v) => $v !== null && $v !== '');

        if (! empty($payload)) {
            RestaurantServiceSettings::updateOrCreate(
                ['restaurant_id' => $restaurant->id],
                $payload,
            );
        }
    }

    protected function writeHours(Restaurant $restaurant, array $data): void
    {
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

    protected function writeDeliverySettings(Restaurant $restaurant, array $data): void
    {
        $payload = array_filter([
            'auto_accept_orders' => array_key_exists('autoAccept', $data) ? (bool) $data['autoAccept'] : null,
            'estimated_prep_time_min' => $data['estimatedPrepTime'] ?? null,
            'packaging_charges' => $data['packagingCharges'] ?? null,
            'tax_type' => $data['taxType'] ?? null,
            'cancellation_cutoff_min' => $data['cancellationCutoff'] ?? null,
        ], fn ($v) => $v !== null && $v !== '');

        if (! empty($payload)) {
            RestaurantDeliverySettings::updateOrCreate(
                ['restaurant_id' => $restaurant->id],
                $payload,
            );
        }
    }

    protected function writeBank(Restaurant $restaurant, array $data): void
    {
        $payload = array_filter([
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

    protected function writeTax(Restaurant $restaurant, array $data): void
    {
        $payload = array_filter([
            'gst_number' => $data['gst'] ?? null,
            'fssai_license' => $data['fssai'] ?? null,
            'pan_number' => $data['pan'] ?? null,
        ], fn ($v) => $v !== null && $v !== '');

        if (! empty($payload)) {
            RestaurantLegalAndBank::updateOrCreate(
                ['restaurant_id' => $restaurant->id],
                $payload,
            );
        }
    }

    // ─── Read helpers (flatten DB rows → frontend FormState) ────────────────

    protected function flattenForm(Restaurant $restaurant): array
    {
        $service = $restaurant->serviceSettings;
        $delivery = $restaurant->deliverySettings;
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

        return [
            // Step 1
            'displayName' => (string) ($restaurant->name ?? ''),
            'tagline' => (string) ($restaurant->tagline ?? ''),
            'description' => (string) ($restaurant->description ?? ''),
            'contactEmail' => (string) ($restaurant->owner_email ?? $restaurant->user?->email ?? ''),
            'contactPhone' => (string) ($restaurant->owner_mobile ?? $restaurant->user?->mobile ?? ''),
            'address' => (string) ($restaurant->full_address ?? ''),
            // Step 3
            'cuisines' => $this->splitCuisines((string) ($restaurant->cuisines ?? '')),
            'deliveryRadius' => $service->delivery_radius_km ?? 6,
            'avgPrepTime' => $service && $service->avg_prep_time_min !== null
                ? (string) $service->avg_prep_time_min : '',
            'minOrderAmount' => $service && $service->min_order_amount !== null
                ? (string) $service->min_order_amount : '',
            'avgTicketSize' => $service && $service->avg_ticket_size !== null
                ? (string) $service->avg_ticket_size : '',
            // Step 4
            'hours' => $hours,
            // Step 5
            'autoAccept' => $delivery?->auto_accept_orders ?? true,
            'estimatedPrepTime' => $delivery && $delivery->estimated_prep_time_min !== null
                ? (string) $delivery->estimated_prep_time_min : '25',
            'packagingCharges' => $delivery && $delivery->packaging_charges !== null
                ? (string) $delivery->packaging_charges : '15',
            'taxType' => (string) ($delivery?->tax_type ?? 'GST 5% (composition)'),
            'cancellationCutoff' => $delivery && $delivery->cancellation_cutoff_min !== null
                ? (string) $delivery->cancellation_cutoff_min : '5',
            // Step 6
            'bankAccountHolder' => (string) ($legal->account_holder_name ?? ''),
            'bankName' => (string) ($legal->bank_name ?? ''),
            'accountNumber' => (string) ($legal->account_number ?? ''),
            'ifsc' => (string) ($legal->ifsc_code ?? ''),
            // Step 7
            'gst' => (string) ($legal->gst_number ?? ''),
            'fssai' => (string) ($legal->fssai_license ?? ''),
            'pan' => (string) ($legal->pan_number ?? ''),
        ];
    }

    protected function imageMeta(Restaurant $restaurant): array
    {
        $gallery = [];
        foreach ($restaurant->galleryImages as $img) {
            $gallery[(int) $img->sort_order] = [
                'url' => Storage::disk('public')->url($img->image_path),
            ];
        }

        return [
            'logo' => $restaurant->logo_path
                ? ['url' => Storage::disk('public')->url($restaurant->logo_path)]
                : null,
            'cover' => $restaurant->cover_photo_path
                ? ['url' => Storage::disk('public')->url($restaurant->cover_photo_path)]
                : null,
            'gallery' => $gallery,
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

    protected function splitCuisines(string $raw): array
    {
        if (trim($raw) === '') {
            return [];
        }

        return array_values(array_filter(array_map('trim', explode(',', $raw))));
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
                'serviceSettings',
                'deliverySettings',
                'hours',
                'galleryImages',
            ])
            ->first();

        if (! $restaurant) {
            abort(403, 'No restaurant profile is attached to this account.');
        }

        return $restaurant;
    }

    protected function guardCompleted(Restaurant $restaurant): void
    {
        if ($restaurant->hasCompletedOnboarding()) {
            throw ValidationException::withMessages([
                'form' => 'Onboarding already completed.',
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
