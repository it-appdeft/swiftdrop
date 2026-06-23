<?php

use App\Http\Controllers\Api\Auth\AuthController as ApiAuthController;
use App\Http\Controllers\Api\Customer\CheckoutController;
use App\Http\Controllers\Api\Customer\CustomerCartController;
use App\Http\Controllers\Api\Customer\CustomerDashboardController;
use App\Http\Controllers\Api\Customer\CustomerFavoriteController;
use App\Http\Controllers\Api\Customer\CustomerProfileController;
use App\Http\Controllers\Api\Customer\CustomerRestaurantController;
use App\Http\Controllers\Api\Customer\CustomerSearchController;
use App\Http\Controllers\Api\DeletionReasonController;
use App\Http\Controllers\Api\LegalContentController;
use App\Http\Controllers\Api\SupportTicketController;
use App\Http\Controllers\Api\Driver\DriverDashboardController;
use App\Http\Controllers\Api\Driver\DriverProfileController;
use App\Http\Controllers\Api\VehicleTypeController;
use Illuminate\Support\Facades\Route;

Route::get('vehicle-types', [VehicleTypeController::class, 'index']);
Route::get('deletion-reasons', [DeletionReasonController::class, 'index']);

// Public legal copy (sourced from platform_config).
Route::controller(LegalContentController::class)->prefix('legal')->group(function () {
    Route::get('/', 'index');
    Route::get('privacy-policy', 'privacyPolicy');
    Route::get('terms-and-conditions', 'terms');
});

Route::prefix('auth')->controller(ApiAuthController::class)->group(function () {
    Route::post('send-otp', 'sendOtp');
    Route::post('verify-otp', 'verifyOtp');
    Route::post('register/{type}', 'register');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', 'logout');
    });
});

Route::middleware('auth:sanctum')->prefix('customer')->group(function () {
    // Home screen — four granular endpoints (the app composes these instead of
    // one combined dashboard payload): profile (selected address), food-types,
    // top-picks and restaurants (paginated, below).
    Route::get('food-types', [CustomerDashboardController::class, 'foodTypes']);
    Route::get('top-picks', [CustomerDashboardController::class, 'topPicks']);

    Route::get('search/history', [CustomerSearchController::class, 'history']);
    Route::delete('search/history', [CustomerSearchController::class, 'clear']);
    // type: `restaurant` (restaurants list) or `items` (restaurants + nested dishes).
    Route::get('search/{type}', [CustomerSearchController::class, 'index'])
        ->whereIn('type', ['restaurant', 'items']);

    Route::get('restaurants', [CustomerRestaurantController::class, 'index']);
    Route::get('restaurants/{id}', [CustomerRestaurantController::class, 'show'])->whereNumber('id');

    Route::controller(CustomerFavoriteController::class)->prefix('favorites')->group(function () {
        Route::get('restaurants', 'restaurants');
        Route::get('menu-items', 'menuItems');
        Route::post('restaurants/{restaurantId}', 'toggleRestaurant')->whereNumber('restaurantId');
        Route::post('menu-items/{menuItemId}', 'toggleMenuItem')->whereNumber('menuItemId');
    });

    Route::controller(CustomerCartController::class)->prefix('cart')->group(function () {
        Route::get('/', 'index');
        Route::post('/', 'store');
        Route::put('items/{itemId}', 'update')->whereNumber('itemId');
        Route::delete('items/{itemId}', 'destroy')->whereNumber('itemId');
        Route::delete('/', 'clear');
    });

    Route::controller(CheckoutController::class)->prefix('checkout')->group(function () {
        Route::get('/', 'summary');
        Route::post('/apply-coupon', 'applyCoupon');
        Route::post('/cooking-request', 'cookingRequest');
        Route::post('/', 'store');
    });

    Route::controller(CustomerProfileController::class)->prefix('profile')->group(function () {
        Route::get('/', 'show');
        Route::get('orders', 'orders');
        Route::put('/', 'update');
        Route::post('delete/initiate', 'initiateDeletion');
        Route::delete('/', 'deleteAccount');
    });

    Route::controller(CustomerProfileController::class)->prefix('addresses')->group(function () {
        Route::get('/', 'addresses');
        Route::post('/', 'addAddress');
        Route::put('{addressId}', 'updateAddress');
        Route::delete('{addressId}', 'deleteAddress');
        Route::post('{addressId}/set-default', 'setDefaultAddress');
        Route::post('{addressId}/select', 'setSelectedAddress');
    });
});

// Shared support tickets — both customers and drivers raise/list tickets here
// (the mobile "Help Center" form). Source is derived from the user's role.
Route::middleware('auth:sanctum')->controller(SupportTicketController::class)->prefix('support-tickets')->group(function () {
    Route::get('/', 'index');
    Route::post('/', 'store');
});

Route::middleware('auth:sanctum')->prefix('driver')->group(function () {
    // Home screen: dashboard snapshot, availability toggle, live location push
    // and accept/reject of an offered delivery request.
    Route::controller(DriverDashboardController::class)->group(function () {
        Route::get('dashboard', 'index');
        Route::get('delivery-requests', 'deliveryRequests');
        Route::post('availability', 'toggleAvailability');
        Route::post('location', 'updateLocation');
        Route::post('deliveries/{delivery}/respond', 'respondToDelivery')->whereNumber('delivery');
    });

    Route::controller(DriverProfileController::class)->prefix('profile')->group(function () {
        Route::get('/', 'show');
        Route::put('/', 'update');
        Route::post('delete/initiate', 'initiateDeletion');
        Route::delete('/', 'deleteAccount');

        Route::post('setup', 'setup');
        Route::post('account-details', 'updateAccountDetails');
        Route::post('documents/single', 'uploadDocument');
        Route::put('notifications', 'updateNotificationSettings');
    });
});
