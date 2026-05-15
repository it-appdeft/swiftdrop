<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'customer'])->prefix('customer')->name('customer.')->group(function () {
    Route::get('dashboard', fn () => Inertia::render('customer/dashboard'))->name('dashboard');
    Route::get('profile', fn () => Inertia::render('customer/profile'))->name('profile');
});
