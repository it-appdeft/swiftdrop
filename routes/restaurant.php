<?php

use App\Http\Controllers\Restaurant\OnboardingController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'restaurant'])->prefix('restaurant')->name('restaurant.')->group(function () {
    Route::get('dashboard', fn () => Inertia::render('restaurant/dashboard'))->name('dashboard');

    Route::controller(OnboardingController::class)
        ->prefix('onboarding')
        ->name('onboarding')
        ->group(function () {
            Route::get('/', 'show');
            Route::post('save', 'save')->name('.save');
            Route::post('images/{type}', 'uploadImage')->name('.images');
            Route::post('documents/{type}', 'uploadDocument')->name('.documents');
            Route::post('submit', 'submit')->name('.submit');
        });
});
