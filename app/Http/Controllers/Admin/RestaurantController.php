<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreRestaurantRequest;
use App\Http\Requests\Admin\UpdateRestaurantRequest;
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
                  ->orWhere('city', 'like', "%{$request->search}%")
                  ->orWhere('postcode', 'like', "%{$request->search}%")
                  ->orWhere('cuisine_type', 'like', "%{$request->search}%");
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
            'documents.verifiedBy',
            'orders' => fn($q) => $q->latest()->limit(10),
        ])->withCount('orders')->findOrFail($id);

        return Inertia::render('admin/restaurants/show', [
            'restaurant' => $restaurant,
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/restaurants/create');
    }

    public function store(StoreRestaurantRequest $request)
    {
        DB::transaction(function () use ($request) {
            $user = User::create([
                'mobile'   => $request->mobile,
                'email'    => $request->email,
                'status'   => 'pending_approval',
                'password' => bcrypt('password'),
            ]);

            $user->assignRole('restaurant_owner');

            Restaurant::create([
                'user_id'         => $user->id,
                'name'            => $request->name,
                'description'     => $request->description,
                'address_line_1'  => $request->address_line_1,
                'address_line_2'  => $request->address_line_2,
                'city'            => $request->city,
                'county'          => $request->county,
                'postcode'        => $request->postcode,
                'lat'             => $request->lat,
                'lng'             => $request->lng,
                'phone'           => $request->phone,
                'cuisine_type'    => $request->cuisine_type,
                'commission_rate' => $request->commission_rate,
                'vat_number'      => $request->vat_number,
                'status'          => 'pending_approval',
                'approval_status' => 'pending',
            ]);
        });

        return redirect()->route('admin.restaurants.index')
            ->with('success', 'Restaurant created successfully.');
    }

    public function edit(int $id)
    {
        $restaurant = Restaurant::with('user')->findOrFail($id);

        return Inertia::render('admin/restaurants/edit', [
            'restaurant' => $restaurant,
        ]);
    }

    public function update(UpdateRestaurantRequest $request, int $id)
    {
        $restaurant = Restaurant::findOrFail($id);

        $restaurant->update($request->only([
            'name', 'description', 'phone',
            'address_line_1', 'address_line_2', 'city', 'county', 'postcode', 'lat', 'lng',
            'cuisine_type', 'commission_rate', 'vat_number',
            'status', 'approval_status',
        ]));

        return redirect()->route('admin.restaurants.show', $id)
            ->with('success', 'Restaurant updated successfully.');
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
