<?php

use App\Http\Controllers\Api\Auth\AuthController as ApiAuthController;
use App\Http\Controllers\Api\Customer\CustomerProfileController;
use App\Http\Controllers\Api\Driver\DriverProfileController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->controller(ApiAuthController::class)->group(function () {
    // Common mobile-only login (customer + driver). Mobile must already exist.
    Route::post('login/send-otp', 'sendLoginOtp');
    Route::post('login/verify-otp', 'verifyLoginOtp');

    // Registration flow — sends OTP to a (possibly new) target so it can be
    // verified before the user record is created.
    Route::post('send-otp', 'sendOtp');
    Route::post('verify-otp', 'verifyOtp');
    Route::post('register/{type}', 'register');
});

Route::middleware('auth:sanctum')->prefix('customer')->group(function () {
    Route::controller(CustomerProfileController::class)->prefix('profile')->group(function () {
        Route::get('/', 'show');
        Route::put('/', 'update');
        Route::delete('/', 'deleteAccount');

        // Phone number management
        Route::post('change-phone/initiate', 'initiatePhoneChange');
        Route::post('change-phone/verify', 'completePhoneChange');

        // Email management
        Route::post('change-email/initiate', 'initiateEmailChange');
        Route::post('change-email/verify', 'completeEmailChange');
    });

    // Address management
    Route::controller(CustomerProfileController::class)->prefix('addresses')->group(function () {
        Route::post('/', 'addAddress');
        Route::put('{addressId}', 'updateAddress');
        Route::delete('{addressId}', 'deleteAddress');
        Route::post('{addressId}/set-default', 'setDefaultAddress');
    });
});

Route::middleware('auth:sanctum')->prefix('driver')->group(function () {
    Route::controller(DriverProfileController::class)->prefix('profile')->group(function () {
        Route::get('/', 'show');
        Route::put('/', 'update');
        Route::delete('/', 'deleteAccount');

        // One-shot onboarding submission (bank + vehicle + documents)
        Route::post('complete-setup', 'completeSetup');

        // Per-step onboarding endpoints (for editing later or partial submission)
        Route::put('bank-details', 'updateBankDetails');
        Route::put('vehicle-details', 'updateVehicleDetails');
        Route::post('documents', 'uploadDocuments');
        Route::post('documents/single', 'uploadDocument');
        Route::post('submit-for-verification', 'submitForVerification');

        // Notification settings
        Route::put('notifications', 'updateNotificationSettings');

        // Phone number management
        Route::post('change-phone/initiate', 'initiatePhoneChange');
        Route::post('change-phone/verify', 'completePhoneChange');

        // Email management
        Route::post('change-email/initiate', 'initiateEmailChange');
        Route::post('change-email/verify', 'completeEmailChange');
    });
});
