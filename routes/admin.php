<?php

use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\DocumentController;
use App\Http\Controllers\Admin\DriverController;
use App\Http\Controllers\Admin\RestaurantController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {

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
});
