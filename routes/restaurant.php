<?php

use App\Http\Controllers\Restaurant\DashboardController;
use App\Http\Controllers\Restaurant\MenuManagementController;
use App\Http\Controllers\Restaurant\ModifierController;
use App\Http\Controllers\Restaurant\SettingsController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'restaurant', 'restaurant.onboarded'])
    ->prefix('restaurant')
    ->name('restaurant.')
    ->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::patch('accepting-orders', [DashboardController::class, 'toggleAcceptingOrders'])
            ->name('accepting-orders.toggle');
        Route::get('orders', fn () => Inertia::render('restaurant/orders'))->name('orders');

        /*
         * ─── Menu Management ────────────────────────────────────────
         * MenuManagementController serves the dish catalogue page +
         * category / item / availability writes. The legacy
         * `restaurant.menu` name resolves to the page itself so old
         * Inertia links keep working.
         */
        Route::get('menu', [MenuManagementController::class, 'index'])->name('menu');
        Route::post('menu/items', [MenuManagementController::class, 'storeItem'])
            ->name('menu.items.store');
        Route::put('menu/items/{item}', [MenuManagementController::class, 'updateItem'])
            ->whereNumber('item')
            ->name('menu.items.update');
        Route::delete('menu/items/{item}', [MenuManagementController::class, 'destroyItem'])
            ->whereNumber('item')
            ->name('menu.items.destroy');
        Route::patch('menu/items/{item}/availability', [MenuManagementController::class, 'toggleItemAvailability'])
            ->whereNumber('item')
            ->name('menu.items.availability');
        Route::post('menu/categories', [MenuManagementController::class, 'storeCategory'])
            ->name('menu.categories.store');
        Route::delete('menu/categories/{category}', [MenuManagementController::class, 'destroyCategory'])
            ->whereNumber('category')
            ->name('menu.categories.destroy');

        /*
         * ─── Modifiers ──────────────────────────────────────────────
         * ModifierController owns the Size / Toppings / Cheese & Dip
         * catalogue that menu items attach to. The page route uses the
         * legacy `restaurant.modifiers` name so the React side keeps
         * resolving without a change.
         */
        Route::get('modifiers', [ModifierController::class, 'index'])->name('modifiers');
        Route::post('modifiers', [ModifierController::class, 'store'])->name('modifiers.store');
        Route::put('modifiers/{modifier}', [ModifierController::class, 'update'])
            ->whereNumber('modifier')
            ->name('modifiers.update');
        Route::delete('modifiers/{modifier}', [ModifierController::class, 'destroy'])
            ->whereNumber('modifier')
            ->name('modifiers.destroy');

        Route::controller(SettingsController::class)->prefix('settings')->group(function () {
            Route::get('/', 'show')->name('settings');
            Route::post('profile', 'updateProfile')->name('settings.profile.update');
            // Edit onboarding details post-submission (identity / location /
            // legal / categories, plus document re-uploads).
            Route::post('section', 'updateSection')->name('settings.section.update');
            Route::post('documents/{type}', 'uploadDocument')->name('settings.documents.upload');
        });
    });
