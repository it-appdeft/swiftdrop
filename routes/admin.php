<?php

use App\Http\Controllers\Admin\CouponController;
use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\DocumentController;
use App\Http\Controllers\Admin\DriverController;
use App\Http\Controllers\Admin\FoodTypeController;
use App\Http\Controllers\Admin\PlatformSettingsController;
use App\Http\Controllers\Admin\RestaurantController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\SupportTicketController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->prefix('admin')->name('admin.')->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store']);
});

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    Route::get('dashboard', fn () => \Inertia\Inertia::render('admin/dashboard'))->name('dashboard');

    // Customers
    Route::get('customers', [CustomerController::class, 'index'])->name('customers.index');
    Route::get('customers/create', [CustomerController::class, 'create'])->name('customers.create');
    Route::post('customers', [CustomerController::class, 'store'])->name('customers.store');
    Route::get('customers/{id}', [CustomerController::class, 'show'])->name('customers.show');
    Route::get('customers/{id}/edit', [CustomerController::class, 'edit'])->name('customers.edit');
    Route::put('customers/{id}', [CustomerController::class, 'update'])->name('customers.update');
    Route::delete('customers/{id}', [CustomerController::class, 'destroy'])->name('customers.destroy');
    Route::patch('customers/{id}/status', [CustomerController::class, 'updateStatus'])->name('customers.status');

    // Drivers
    Route::get('drivers', [DriverController::class, 'index'])->name('drivers.index');
    Route::get('drivers/create', [DriverController::class, 'create'])->name('drivers.create');
    Route::post('drivers', [DriverController::class, 'store'])->name('drivers.store');
    Route::get('drivers/{id}', [DriverController::class, 'show'])->name('drivers.show');
    Route::get('drivers/{id}/edit', [DriverController::class, 'edit'])->name('drivers.edit');
    Route::put('drivers/{id}', [DriverController::class, 'update'])->name('drivers.update');
    Route::delete('drivers/{id}', [DriverController::class, 'destroy'])->name('drivers.destroy');
    Route::patch('drivers/{id}/status', [DriverController::class, 'updateStatus'])->name('drivers.status');
    Route::patch('drivers/{id}/approval', [DriverController::class, 'updateApproval'])->name('drivers.approval');

    // Restaurants
    Route::get('restaurants', [RestaurantController::class, 'index'])->name('restaurants.index');
    Route::get('restaurants/create', [RestaurantController::class, 'create'])->name('restaurants.create');
    Route::post('restaurants', [RestaurantController::class, 'store'])->name('restaurants.store');
    Route::get('restaurants/{id}', [RestaurantController::class, 'show'])->name('restaurants.show');
    Route::get('restaurants/{id}/edit', [RestaurantController::class, 'edit'])->name('restaurants.edit');
    Route::put('restaurants/{id}', [RestaurantController::class, 'update'])->name('restaurants.update');
    Route::delete('restaurants/{id}', [RestaurantController::class, 'destroy'])->name('restaurants.destroy');
    Route::patch('restaurants/{id}/status', [RestaurantController::class, 'updateStatus'])->name('restaurants.status');
    Route::patch('restaurants/{id}/approval', [RestaurantController::class, 'updateApproval'])->name('restaurants.approval');

    // Documents
    Route::patch('documents/{document}/approve', [DocumentController::class, 'approve'])->name('documents.approve');
    Route::patch('documents/{document}/reject', [DocumentController::class, 'reject'])->name('documents.reject');

    // Platform Settings
    Route::get('platform-settings', [PlatformSettingsController::class, 'edit'])->name('platform-settings.edit');
    Route::put('platform-settings', [PlatformSettingsController::class, 'update'])->name('platform-settings.update');

    // Coupons (backed by the Offer model)
    Route::get('coupons', [CouponController::class, 'index'])->name('coupons.index');
    Route::get('coupons/create', [CouponController::class, 'create'])->name('coupons.create');
    Route::post('coupons', [CouponController::class, 'store'])->name('coupons.store');
    Route::get('coupons/{id}/edit', [CouponController::class, 'edit'])->name('coupons.edit');
    Route::put('coupons/{id}', [CouponController::class, 'update'])->name('coupons.update');
    Route::delete('coupons/{id}', [CouponController::class, 'destroy'])->name('coupons.destroy');
    Route::patch('coupons/{id}/status', [CouponController::class, 'updateStatus'])->name('coupons.status');

    // Food Items
    Route::get('food-types', [FoodTypeController::class, 'index'])->name('food-types.index');
    Route::get('food-types/create', [FoodTypeController::class, 'create'])->name('food-types.create');
    Route::post('food-types', [FoodTypeController::class, 'store'])->name('food-types.store');
    Route::get('food-types/{id}/edit', [FoodTypeController::class, 'edit'])->name('food-types.edit');
    Route::post('food-types/{id}', [FoodTypeController::class, 'update'])->name('food-types.update');
    Route::delete('food-types/{id}', [FoodTypeController::class, 'destroy'])->name('food-types.destroy');

    // Orders
    Route::get('orders', [OrderController::class, 'index'])->name('orders.index');

    // Support Tickets (customer + restaurant)
    Route::get('support-tickets', [SupportTicketController::class, 'index'])->name('support-tickets.index');
    Route::patch('support-tickets/{ticket}/status', [SupportTicketController::class, 'updateStatus'])->name('support-tickets.status');
});
