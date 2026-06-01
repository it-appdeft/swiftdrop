<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreRestaurantRequest;
use App\Http\Requests\Admin\UpdateRestaurantRequest;
use App\Models\FoodType;
use App\Models\MenuCategory;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RestaurantController extends Controller
{
    public function index(Request $request)
    {
        $restaurants = Restaurant::with('user')
            ->withCount('orders')
            ->when($request->search, fn($q) => $q->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('full_address', 'like', "%{$request->search}%")
                  ->orWhere('cuisines', 'like', "%{$request->search}%");
            }))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->approval_status, fn($q) => $q->where('approval_status', $request->approval_status))
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/restaurants/index', [
            'restaurants' => $restaurants,
            'filters'     => $request->only(['search', 'status', 'approval_status']),
            'stats'       => [
                'total'            => Restaurant::count(),
                'active'           => Restaurant::where('status', 'active')->count(),
                'approved'         => Restaurant::where('approval_status', 'approved')->count(),
                'pending_approval' => Restaurant::where('approval_status', 'pending')->count(),
            ],
        ]);
    }

    public function show(int $id)
    {
        $restaurant = Restaurant::with([
            'user',
            'foodTypes',
            'categories',
            'documents.verifiedBy',
            'orders' => fn($q) => $q->latest()->limit(10),
        ])->withCount('orders')->findOrFail($id);

        return Inertia::render('admin/restaurants/show', [
            'restaurant'     => $restaurant,
            'foodTypeNames'  => $restaurant->foodTypes->pluck('name')->values()->all(),
            'menuCategories' => $restaurant->categories
                ->sortBy('sort_order')
                ->pluck('name')
                ->values()
                ->all(),
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/restaurants/create', [
            'foodTypes'        => $this->foodTypeOptions(),
            'googleMapsApiKey' => config('services.google_maps.key'),
        ]);
    }

    public function store(StoreRestaurantRequest $request)
    {
        DB::transaction(function () use ($request) {
            $user = User::create([
                // Split storage: subscriber digits in mobile, dialling prefix
                // in country_code, ISO alpha-2 in country_iso (exact flag).
                'mobile'       => $request->localMobile(),
                'country_code' => $request->country_code,
                'country_iso'  => $request->country_iso,
                'email'        => $request->email,
                'status'       => 'pending_approval',
                'password'     => bcrypt('password'),
            ]);

            $user->assignRole('restaurant_owner');

            $restaurant = Restaurant::create([
                'user_id'             => $user->id,
                'name'                => $request->name,
                'legal_business_name' => $request->legal_business_name,
                'owner_name'          => $request->owner_name,
                'owner_email'         => $request->email,
                'owner_mobile'        => $request->canonicalMobile(),
                'restaurant_type'     => $request->restaurant_type,
                'branches'            => $request->branches,
                'seating_capacity'    => $request->seating_capacity,
                'full_address'        => $request->full_address,
                'city'                => $request->city,
                'pin_code'            => $request->pin_code,
                'lat'                 => $request->lat,
                'lng'                 => $request->lng,
                'description'         => $request->description,
                'commission_rate'     => $request->commission_rate,
                'status'              => 'pending_approval',
                'approval_status'     => 'pending',
            ]);

            $foodTypeIds = collect((array) $request->input('food_type_ids', []))
                ->map(fn ($id) => (int) $id)
                ->filter(fn ($id) => $id > 0)
                ->unique()
                ->values()
                ->all();

            if ($foodTypeIds !== []) {
                $restaurant->foodTypes()->sync($foodTypeIds);
            }

            foreach (array_values((array) $request->input('categories', [])) as $idx => $row) {
                $name = trim((string) ($row['name'] ?? ''));
                if ($name === '') {
                    continue;
                }

                MenuCategory::create([
                    'restaurant_id' => $restaurant->id,
                    'name'          => $name,
                    'sort_order'    => $idx,
                    'is_active'     => true,
                ]);
            }
        });

        return redirect()->route('admin.restaurants.index')
            ->with('success', 'Restaurant created successfully.');
    }

    /**
     * Catalog of food types the admin can pick when creating a restaurant.
     * Mirrors {@see \App\Http\Controllers\Restaurant\Concerns\ManagesPartnerApplication::foodTypeOptions()}
     * so the chip selector here renders identically to the partner-onboarding step.
     */
    protected function foodTypeOptions(): array
    {
        return FoodType::query()
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'image'])
            ->map(fn (FoodType $item) => [
                'id'        => (int) $item->id,
                'name'      => (string) $item->name,
                'slug'      => (string) $item->slug,
                'image_url' => $item->image_url,
            ])
            ->all();
    }

    public function edit(int $id)
    {
        $restaurant = Restaurant::with(['user', 'foodTypes', 'categories'])->findOrFail($id);

        return Inertia::render('admin/restaurants/edit', [
            'restaurant'        => $restaurant,
            'foodTypes'         => $this->foodTypeOptions(),
            'selectedFoodTypes' => $restaurant->foodTypes->pluck('id')->map(fn ($id) => (int) $id)->values()->all(),
            'menuCategories'    => $restaurant->categories
                ->sortBy('sort_order')
                ->values()
                ->map(fn ($c) => ['name' => (string) $c->name])
                ->all(),
            'ownerEmail'        => (string) ($restaurant->user?->email ?? $restaurant->owner_email ?? ''),
            'ownerCountryCode'  => (string) ($restaurant->user?->country_code ?? '+44'),
            'ownerCountryIso'   => (string) ($restaurant->user?->country_iso ?? 'GB'),
            'ownerMobile'       => (string) ($restaurant->user?->mobile ?? ''),
            'googleMapsApiKey'  => config('services.google_maps.key'),
        ]);
    }

    public function update(UpdateRestaurantRequest $request, int $id)
    {
        $restaurant = Restaurant::with('user')->findOrFail($id);

        DB::transaction(function () use ($request, $restaurant) {
            $restaurant->update($request->only([
                'name', 'legal_business_name', 'owner_name',
                'restaurant_type', 'branches', 'seating_capacity',
                'full_address', 'city', 'pin_code', 'lat', 'lng',
                'description', 'commission_rate',
                'status', 'approval_status',
            ]));

            // Owner account (mirrors create): keep the login on the User model
            // and the snapshot fields on the Restaurant row aligned.
            if ($restaurant->user) {
                $restaurant->user->update([
                    'email'        => $request->email,
                    'mobile'       => $request->localMobile(),
                    'country_code' => $request->country_code,
                    'country_iso'  => $request->country_iso,
                ]);
            }

            $restaurant->update([
                'owner_email'  => $request->email,
                'owner_mobile' => $request->canonicalMobile(),
            ]);

            if ($request->has('food_type_ids')) {
                $foodTypeIds = collect((array) $request->input('food_type_ids', []))
                    ->map(fn ($id) => (int) $id)
                    ->filter(fn ($id) => $id > 0)
                    ->unique()
                    ->values()
                    ->all();

                $restaurant->foodTypes()->sync($foodTypeIds);
            }

            if ($request->has('categories')) {
                $this->syncMenuCategories($restaurant, (array) $request->input('categories', []));
            }
        });

        return redirect()->route('admin.restaurants.show', $id)
            ->with('success', 'Restaurant updated successfully.');
    }

    /**
     * Replace-by-name sync for an edit submission: existing categories whose
     * names still appear in the payload keep their IDs (so menu_items.category_id
     * survives), missing ones are deleted, and new names get inserted at the
     * payload's order. Mirrors the partner-onboarding behaviour so the admin
     * form is a true edit, not a wipe-and-recreate.
     */
    protected function syncMenuCategories(Restaurant $restaurant, array $rows): void
    {
        $keep = [];

        foreach (array_values($rows) as $idx => $row) {
            if (! is_array($row)) {
                continue;
            }

            $name = trim((string) ($row['name'] ?? ''));
            if ($name === '') {
                continue;
            }

            MenuCategory::updateOrCreate(
                ['restaurant_id' => $restaurant->id, 'name' => $name],
                ['sort_order' => $idx, 'is_active' => true],
            );

            $keep[] = $name;
        }

        $restaurant->categories()
            ->when($keep !== [], fn ($q) => $q->whereNotIn('name', $keep))
            ->delete();
    }

    public function destroy(int $id)
    {
        $restaurant = Restaurant::withCount('orders')->findOrFail($id);

        if ($restaurant->orders_count > 0) {
            return back()->with('error', 'Cannot delete a restaurant with existing orders. Suspend it instead.');
        }

        $restaurant->delete();

        return redirect()->route('admin.restaurants.index')
            ->with('success', 'Restaurant deleted.');
    }

    public function updateStatus(Request $request, int $id)
    {
        $request->validate(['status' => ['required', 'in:pending_approval,active,inactive,suspended']]);

        $restaurant = Restaurant::findOrFail($id);
        $restaurant->update(['status' => $request->status]);

        return back()->with('success', 'Restaurant status updated.');
    }

    public function updateApproval(Request $request, int $id)
    {
        $request->validate(['approval_status' => ['required', 'in:pending,approved,rejected']]);

        $restaurant = Restaurant::with('user')->findOrFail($id);
        $restaurant->update(['approval_status' => $request->approval_status]);

        if ($request->approval_status === 'approved') {
            $restaurant->update(['status' => 'active']);
            $restaurant->user->update(['status' => 'active']);
        }

        return back()->with('success', 'Restaurant approval status updated.');
    }
}
