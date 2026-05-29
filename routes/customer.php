<?php

use App\Http\Controllers\Web\Customer\CheckoutController;
use App\Http\Controllers\Web\Customer\CustomerCartController;
use App\Http\Controllers\Web\Customer\CustomerDashboardController;
use App\Http\Controllers\Web\Customer\CustomerFavoriteController;
use App\Http\Controllers\Web\Customer\CustomerProfileController;
use App\Http\Controllers\Web\Customer\CustomerRestaurantController;
use App\Http\Controllers\Web\Customer\CustomerSearchController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'customer'])->prefix('customer')->name('customer.')->group(function () {
    Route::get('dashboard', [CustomerDashboardController::class, 'index'])->name('dashboard');

    Route::get('search', [CustomerSearchController::class, 'index'])->name('search');
    Route::get('search/history', [CustomerSearchController::class, 'history'])->name('search.history');
    Route::delete('search/history', [CustomerSearchController::class, 'clear'])->name('search.clear');

    Route::get('restaurants', [CustomerRestaurantController::class, 'index'])->name('restaurants.index');
    Route::get('restaurants/{id}', [CustomerRestaurantController::class, 'show'])
        ->whereNumber('id')->name('restaurants.show');

    // Saved favourites — JSON lists (profile Favorites tab, paginated +
    // infinite scroll) and the heart toggles (flip without an Inertia visit).
    Route::get('favorites/restaurants', [CustomerFavoriteController::class, 'restaurants'])->name('favorites.restaurants');
    Route::get('favorites/menu-items', [CustomerFavoriteController::class, 'menuItems'])->name('favorites.menu-items');
    Route::post('favorites/restaurants/{restaurantId}', [CustomerFavoriteController::class, 'toggleRestaurant'])
        ->whereNumber('restaurantId')->name('favorites.restaurants.toggle');
    Route::post('favorites/menu-items/{menuItemId}', [CustomerFavoriteController::class, 'toggleMenuItem'])
        ->whereNumber('menuItemId')->name('favorites.menu-items.toggle');

    // Cart: view + mutations. Mutations redirect back so the restaurant page
    // re-renders with the refreshed `cart` prop (steppers + bottom bar).
    Route::controller(CustomerCartController::class)->group(function () {
        Route::get('cart', 'index')->name('cart');
        Route::post('cart', 'store')->name('cart.store');
        Route::put('cart/items/{itemId}', 'update')->whereNumber('itemId')->name('cart.update');
        Route::delete('cart/items/{itemId}', 'destroy')->whereNumber('itemId')->name('cart.destroy');
        Route::delete('cart', 'clear')->name('cart.clear');
    });

    // Checkout: summary recomputes on GET (address_id / coupon query params),
    // place order on POST.
    Route::get('checkout', [CheckoutController::class, 'index'])->name('checkout');
    Route::post('checkout', [CheckoutController::class, 'store'])->name('checkout.place');

    Route::controller(CustomerProfileController::class)->group(function () {
        Route::get('profile', 'show')->name('profile');
        Route::get('profile/orders', 'orders')->name('profile.orders');
        Route::put('profile', 'update')->name('profile.update');

        // Change phone / email — both legs of the two-step flow go through
        // the unified OTP endpoints below (type drives which step).
        Route::post('profile/otp/send', 'sendOtp')->name('profile.otp.send');
        Route::post('profile/otp/verify', 'verifyOtp')->name('profile.otp.verify');

        // Account deletion.
        Route::post('profile/delete/initiate', 'initiateDeletion')->name('profile.delete.initiate');
        Route::delete('profile', 'deleteAccount')->name('profile.delete');

        // Saved addresses.
        Route::get('addresses', 'addresses')->name('addresses.index');
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
