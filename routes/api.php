<?php

use App\Http\Controllers\Api\Auth\AuthController as ApiAuthController;
use App\Http\Controllers\Api\Customer\CustomerProfileController;
use App\Http\Controllers\Api\DeletionReasonController;
use App\Http\Controllers\Api\Driver\DriverProfileController;
use App\Http\Controllers\Api\VehicleTypeController;
use Illuminate\Support\Facades\Route;

Route::get('vehicle-types', [VehicleTypeController::class, 'index']);
Route::get('deletion-reasons', [DeletionReasonController::class, 'index']);

Route::prefix('auth')->controller(ApiAuthController::class)->group(function () {
    Route::post('send-otp', 'sendOtp');
    Route::post('verify-otp', 'verifyOtp');
    Route::post('register/{type}', 'register');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', 'logout');
    });
});

Route::middleware('auth:sanctum')->prefix('customer')->group(function () {
    Route::controller(CustomerProfileController::class)->prefix('profile')->group(function () {
        Route::get('/', 'show');
        Route::put('/', 'update');
        Route::post('delete/initiate', 'initiateDeletion');
        Route::delete('/', 'deleteAccount');
    });

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
        Route::post('delete/initiate', 'initiateDeletion');
        Route::delete('/', 'deleteAccount');

        Route::post('setup', 'setup');
        Route::post('account-details', 'updateAccountDetails');
        Route::post('documents/single', 'uploadDocument');
        Route::put('notifications', 'updateNotificationSettings');
    });
});
