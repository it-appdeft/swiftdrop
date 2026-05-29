<?php

namespace App\Http\Controllers\Restaurant\Concerns;

use App\Models\FoodItem;
use App\Models\MenuCategory;
use App\Models\Restaurant;
use App\Models\RestaurantDocument;
use App\Models\RestaurantHour;
use App\Models\RestaurantLegalAndBank;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Shared read/write logic for the partner application data (restaurant
 * identity, location & hours, legal & bank, categories, documents).
 *
 * Used by both the onboarding wizard ({@see \App\Http\Controllers\Restaurant\PartnerApplicationController})
 * and the post-onboarding Settings screen ({@see \App\Http\Controllers\Restaurant\SettingsController}),
 * so the two stay in lock-step on field mapping and persistence.
 */
trait ManagesPartnerApplication
{
    /**
     * Catalog of food items the partner can pick from in Step 1.
     *
     * @return array<int, array{id: int, name: string, slug: string, image_url: ?string}>
     */
    protected function foodItemOptions(): array
    {
        return FoodItem::query()
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'image'])
            ->map(fn ($item) => [
                'id' => (int) $item->id,
                'name' => (string) $item->name,
                'slug' => (string) $item->slug,
                'image_url' => $item->image_url,
            ])
            ->all();
    }

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
            'branches' => isset($data['branches']) && $data['branches'] !== ''
                ? (int) $data['branches'] : null,
            'seating_capacity' => isset($data['seating']) && $data['seating'] !== ''
                ? (int) $data['seating'] : null,
        ], fn ($v) => $v !== null && $v !== ''))->save();

        // Sync the pivot only when the field is present in the payload — lets
        // partial saves (e.g. autosave) skip the food-items step without
        // wiping previously-selected categories.
        if (array_key_exists('foodItemIds', $data)) {
            $ids = collect((array) $data['foodItemIds'])
                ->map(fn ($id) => (int) $id)
                ->filter(fn ($id) => $id > 0)
                ->unique()
                ->values()
                ->all();

            $restaurant->foodItems()->sync($ids);
        }
    }

    protected function writeLocationHours(Restaurant $restaurant, array $data): void
    {
        $restaurant->fill(array_filter([
            'full_address' => $data['fullAddress'] ?? null,
            'city' => $data['city'] ?? null,
            'pin_code' => $data['pinCode'] ?? null,
        ], fn ($v) => $v !== null && $v !== ''))->save();

        // Map pin — saved separately so a 0/empty coordinate isn't filtered out
        // by array_filter above. Only persists when both are present.
        if (isset($data['lat'], $data['lng']) && is_numeric($data['lat']) && is_numeric($data['lng'])) {
            $restaurant->forceFill([
                'lat' => (float) $data['lat'],
                'lng' => (float) $data['lng'],
            ])->save();
        }

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

    protected function writeCategories(Restaurant $restaurant, array $data): void
    {
        $rows = (array) ($data['categories'] ?? []);

        // Replace-all keyed by name so re-saving the step keeps existing
        // category IDs stable where the name is unchanged, and drops the
        // ones the partner removed.
        $keepNames = [];

        foreach (array_values($rows) as $idx => $row) {
            if (! is_array($row)) {
                continue;
            }

            $name = trim((string) ($row['name'] ?? ''));
            if ($name === '') {
                continue; // Skip blank rows the user left empty
            }

            $diet = in_array($row['diet'] ?? null, ['veg', 'non_veg'], true)
                ? $row['diet'] : null;

            MenuCategory::updateOrCreate(
                ['restaurant_id' => $restaurant->id, 'name' => $name],
                ['diet' => $diet, 'sort_order' => $idx, 'is_active' => true],
            );

            $keepNames[] = $name;
        }

        // Remove categories the partner cleared out during this step.
        $restaurant->categories()
            ->when($keepNames !== [], fn ($q) => $q->whereNotIn('name', $keepNames))
            ->delete();
    }

    /**
     * Store (or replace) a single application document file and return its path.
     */
    protected function storeDocument(Restaurant $restaurant, string $documentType, UploadedFile $file): void
    {
        $column = RestaurantDocument::TYPE_TO_COLUMN[$documentType];

        $path = $file->store("partner-applications/{$restaurant->id}", 'public');

        $existing = $restaurant->applicationDocuments;
        if ($existing && $existing->{$column}) {
            $this->replaceFile($existing->{$column}, $path);
        }

        RestaurantDocument::updateOrCreate(
            ['restaurant_id' => $restaurant->id],
            [$column => $path],
        );
    }

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

        $categories = $restaurant->categories
            ->sortBy('sort_order')
            ->map(fn ($cat) => [
                'name' => (string) $cat->name,
                'diet' => in_array($cat->diet, ['veg', 'non_veg'], true) ? $cat->diet : 'veg',
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
            'foodItemIds' => $restaurant->foodItems->pluck('id')->map(fn ($id) => (int) $id)->values()->all(),
            'branches' => $restaurant->branches !== null ? (string) $restaurant->branches : '',
            'seating' => $restaurant->seating_capacity !== null ? (string) $restaurant->seating_capacity : '',
            // Step 2 — Location & Hours
            'fullAddress' => (string) ($restaurant->full_address ?? ''),
            'city' => (string) ($restaurant->city ?? ''),
            'pinCode' => (string) ($restaurant->pin_code ?? ''),
            'lat' => $restaurant->lat !== null ? (float) $restaurant->lat : null,
            'lng' => $restaurant->lng !== null ? (float) $restaurant->lng : null,
            'hours' => $hours,
            // Step 3 — Legal & Bank
            'gst' => (string) ($legal->gst_number ?? ''),
            'fssai' => (string) ($legal->fssai_license ?? ''),
            'pan' => (string) ($legal->pan_number ?? ''),
            'bankAccountHolder' => (string) ($legal->account_holder_name ?? ''),
            'bankName' => (string) ($legal->bank_name ?? ''),
            'accountNumber' => (string) ($legal->account_number ?? ''),
            'ifsc' => (string) ($legal->ifsc_code ?? ''),
            // Step 5 — Categories
            'categories' => $categories,
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

    protected function replaceFile(?string $oldPath, string $newPath): void
    {
        if ($oldPath && $oldPath !== $newPath && Storage::disk('public')->exists($oldPath)) {
            Storage::disk('public')->delete($oldPath);
        }
    }
}
