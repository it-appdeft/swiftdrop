<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDriverRequest;
use App\Http\Requests\Admin\UpdateDriverRequest;
use App\Models\DriverProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DriverController extends Controller
{
    public function index(Request $request)
    {
        $drivers = User::role('driver')
            ->with(['driverProfile' => fn($q) => $q->withCount([
                'deliveries',
                'documents',
                'documents as pending_documents_count' => fn($q) => $q->where('verification_status', 'pending'),
            ])])
            ->when($request->search, fn($q) => $q->where(function ($q) use ($request) {
                $q->where('mobile', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%")
                  ->orWhereHas('driverProfile', fn($q) =>
                      $q->where('first_name', 'like', "%{$request->search}%")
                        ->orWhere('last_name', 'like', "%{$request->search}%")
                        ->orWhere('vehicle_registration', 'like', "%{$request->search}%")
                  );
            }))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->approval_status, fn($q) => $q->whereHas('driverProfile',
                fn($q) => $q->where('approval_status', $request->approval_status)
            ))
            ->when($request->availability, fn($q) => $q->whereHas('driverProfile',
                fn($q) => $q->where('availability', $request->availability)
            ))
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/drivers/index', [
            'drivers' => $drivers,
            'filters' => $request->only(['search', 'status', 'approval_status', 'availability']),
            'stats'   => [
                'total'            => User::role('driver')->count(),
                'online'           => User::role('driver')->whereHas('driverProfile', fn($q) => $q->where('availability', 'online'))->count(),
                'approved'         => User::role('driver')->whereHas('driverProfile', fn($q) => $q->where('approval_status', 'approved'))->count(),
                'pending_approval' => User::role('driver')->whereHas('driverProfile', fn($q) => $q->where('approval_status', 'pending'))->count(),
            ],
        ]);
    }

    public function show(int $id)
    {
        $driver = User::role('driver')
            ->with([
                'driverProfile.documents.verifiedBy',
                'driverProfile.deliveries' => fn($q) => $q->latest()->limit(10)->with('order'),
            ])
            ->findOrFail($id);

        return Inertia::render('admin/drivers/show', [
            'driver' => $driver,
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/drivers/create');
    }

    public function store(StoreDriverRequest $request)
    {
        DB::transaction(function () use ($request) {
            $user = User::create([
                'mobile'   => $request->mobile,
                'email'    => $request->email,
                'status'   => 'pending_approval',
                'password' => null,
            ]);

            $user->assignRole('driver');

            DriverProfile::create([
                'user_id'              => $user->id,
                'first_name'           => $request->first_name,
                'last_name'            => $request->last_name,
                'vehicle_type'         => $request->vehicle_type,
                'vehicle_make'         => $request->vehicle_make,
                'vehicle_model'        => $request->vehicle_model,
                'vehicle_registration' => $request->vehicle_registration,
                'availability'         => 'offline',
                'approval_status'      => 'pending',
            ]);
        });

        return redirect()->route('admin.drivers.index')
            ->with('success', 'Driver created successfully.');
    }

    public function edit(int $id)
    {
        $driver = User::role('driver')->with('driverProfile')->findOrFail($id);

        return Inertia::render('admin/drivers/edit', [
            'driver' => $driver,
        ]);
    }

    public function update(UpdateDriverRequest $request, int $id)
    {
        $driver = User::role('driver')->with('driverProfile')->findOrFail($id);

        DB::transaction(function () use ($request, $driver) {
            $driver->update($request->only(['mobile', 'email', 'status']));

            if ($driver->driverProfile) {
                $driver->driverProfile->update($request->only([
                    'first_name', 'last_name', 'vehicle_type',
                    'vehicle_make', 'vehicle_model', 'vehicle_registration', 'approval_status',
                ]));
            } else {
                DriverProfile::create([
                    'user_id'         => $driver->id,
                    'availability'    => 'offline',
                    'approval_status' => $request->approval_status ?? 'pending',
                    ...$request->only(['first_name', 'last_name', 'vehicle_type', 'vehicle_make', 'vehicle_model', 'vehicle_registration']),
                ]);
            }
        });

        return redirect()->route('admin.drivers.show', $id)
            ->with('success', 'Driver updated successfully.');
    }

    public function destroy(int $id)
    {
        $driver = User::role('driver')
            ->with(['driverProfile' => fn($q) => $q->withCount('deliveries')])
            ->findOrFail($id);

        if ($driver->driverProfile?->deliveries_count > 0) {
            return back()->with('error', 'Cannot delete a driver with existing deliveries. Suspend the account instead.');
        }

        $driver->delete();

        return redirect()->route('admin.drivers.index')
            ->with('success', 'Driver deleted.');
    }

    public function updateStatus(Request $request, int $id)
    {
        $request->validate(['status' => ['required', 'in:active,suspended,pending_approval']]);

        $driver = User::role('driver')->findOrFail($id);
        $driver->update(['status' => $request->status]);

        return back()->with('success', 'Driver status updated.');
    }

    public function updateApproval(Request $request, int $id)
    {
        $request->validate(['approval_status' => ['required', 'in:pending,approved,rejected']]);

        $driver = User::role('driver')->with('driverProfile')->findOrFail($id);
        $driver->driverProfile->update(['approval_status' => $request->approval_status]);

        if ($request->approval_status === 'approved') {
            $driver->update(['status' => 'active']);
        }

        return back()->with('success', 'Driver approval status updated.');
    }
}
