<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'restaurant', 'restaurant.onboarded'])
    ->prefix('restaurant')
    ->name('restaurant.')
    ->group(function () {
        Route::get('dashboard', fn () => Inertia::render('restaurant/dashboard'))->name('dashboard');
    });
