<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCustomerRequest;
use App\Http\Requests\Admin\UpdateCustomerRequest;
use App\Models\CustomerProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $customers = User::role('customer')
            ->with('customerProfile')
            ->withCount('orders')
            ->when($request->search, fn($q) => $q->where(function ($q) use ($request) {
                $q->where('mobile', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%")
                  ->orWhereHas('customerProfile', fn($q) =>
                      $q->where('first_name', 'like', "%{$request->search}%")
                        ->orWhere('last_name', 'like', "%{$request->search}%")
                  );
            }))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/customers/index', [
            'customers' => $customers,
            'filters'   => $request->only(['search', 'status']),
            'stats'     => [
                'total'     => User::role('customer')->count(),
                'active'    => User::role('customer')->where('status', 'active')->count(),
                'suspended' => User::role('customer')->where('status', 'suspended')->count(),
                'pending'   => User::role('customer')->where('status', 'pending_approval')->count(),
            ],
        ]);
    }

    public function show(int $id)
    {
        $customer = User::role('customer')
            ->with(['customerProfile.addresses', 'orders' => fn($q) => $q->latest()->limit(10)])
            ->withCount('orders')
            ->findOrFail($id);

        return Inertia::render('admin/customers/show', [
            'customer' => $customer,
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/customers/create');
    }

    public function store(StoreCustomerRequest $request)
    {
        DB::transaction(function () use ($request) {
            $user = User::create([
                'mobile'   => $request->mobile,
                'email'    => $request->email,
                'status'   => 'active',
                'password' => null,
            ]);

            $user->assignRole('customer');

            CustomerProfile::create([
                'user_id'       => $user->id,
                'first_name'    => $request->first_name,
                'last_name'     => $request->last_name,
                'date_of_birth' => $request->date_of_birth,
            ]);
        });

        return redirect()->route('admin.customers.index')
            ->with('success', 'Customer created successfully.');
    }

    public function edit(int $id)
    {
        $customer = User::role('customer')->with('customerProfile')->findOrFail($id);

        return Inertia::render('admin/customers/edit', [
            'customer' => $customer,
        ]);
    }

    public function update(UpdateCustomerRequest $request, int $id)
    {
        $customer = User::role('customer')->findOrFail($id);

        DB::transaction(function () use ($request, $customer) {
            $customer->update($request->only(['mobile', 'email', 'status']));

            if ($customer->customerProfile) {
                $customer->customerProfile->update($request->only(['first_name', 'last_name', 'date_of_birth']));
            } else {
                CustomerProfile::create([
                    'user_id'    => $customer->id,
                    ...$request->only(['first_name', 'last_name', 'date_of_birth']),
                ]);
            }
        });

        return redirect()->route('admin.customers.show', $id)
            ->with('success', 'Customer updated successfully.');
    }

    public function destroy(int $id)
    {
        $customer = User::role('customer')->withCount('orders')->findOrFail($id);

        if ($customer->orders_count > 0) {
            return back()->with('error', 'Cannot delete a customer with existing orders. Suspend the account instead.');
        }

        $customer->delete();

        return redirect()->route('admin.customers.index')
            ->with('success', 'Customer deleted.');
    }

    public function updateStatus(Request $request, int $id)
    {
        $request->validate(['status' => ['required', 'in:active,suspended,pending_approval']]);

        $customer = User::role('customer')->findOrFail($id);
        $customer->update(['status' => $request->status]);

        return back()->with('success', 'Customer status updated.');
    }
}
