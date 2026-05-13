<?php

use App\Http\Controllers\Api\Auth\AuthController as ApiAuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->controller(ApiAuthController::class)->group(function () {
    Route::post('send-otp', 'sendOtp')->name('api.auth.send-otp');
    Route::post('verify-otp', 'verifyOtp')->name('api.auth.verify-otp');
    Route::post('register/customer', 'registerCustomer')->name('api.auth.register.customer');
    Route::post('register/restaurant', 'registerRestaurant')->name('api.auth.register.restaurant');
});
