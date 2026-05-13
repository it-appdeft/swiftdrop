<?php

use App\Http\Controllers\Api\Auth\AuthController as ApiAuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->controller(ApiAuthController::class)->group(function () {
    Route::post('send-otp', 'sendOtp')->name('auth.send-otp');
    Route::post('verify-otp', 'verifyOtp')->name('auth.verify-otp');
    Route::post('register/customer', 'registerCustomer')->name('auth.register.customer');
    Route::post('register/restaurant', 'registerRestaurant')->name('auth.register.restaurant');
});
