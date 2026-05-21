<?php

use App\Http\Controllers\Web\Customer\CustomerDashboardController;
use App\Http\Controllers\Web\Customer\CustomerProfileController;
use App\Http\Controllers\Web\Customer\CustomerSearchController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'customer'])->prefix('customer')->name('customer.')->group(function () {
    Route::get('dashboard', [CustomerDashboardController::class, 'index'])->name('dashboard');

    Route::get('search', [CustomerSearchController::class, 'index'])->name('search');
    Route::delete('search/history', [CustomerSearchController::class, 'clear'])->name('search.clear');

    Route::controller(CustomerProfileController::class)->group(function () {
        Route::get('profile', 'show')->name('profile');
        Route::put('profile', 'update')->name('profile.update');

        // Change phone / email — both legs of the two-step flow go through
        // the unified OTP endpoints below (type drives which step).
        Route::post('profile/otp/send', 'sendOtp')->name('profile.otp.send');
        Route::post('profile/otp/verify', 'verifyOtp')->name('profile.otp.verify');

        // Account deletion.
        Route::post('profile/delete/initiate', 'initiateDeletion')->name('profile.delete.initiate');
        Route::delete('profile', 'deleteAccount')->name('profile.delete');

        // Saved addresses.
        Route::post('addresses', 'addAddress')->name('addresses.store');
        Route::put('addresses/{addressId}', 'updateAddress')
            ->whereNumber('addressId')->name('addresses.update');
        Route::delete('addresses/{addressId}', 'deleteAddress')
            ->whereNumber('addressId')->name('addresses.delete');
        Route::post('addresses/{addressId}/set-default', 'setDefaultAddress')
            ->whereNumber('addressId')->name('addresses.default');
        Route::post('addresses/{addressId}/select', 'setSelectedAddress')
            ->whereNumber('addressId')->name('addresses.select');
    });
});
