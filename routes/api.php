<?php

use App\Http\Controllers\Api\Auth\AuthController as ApiAuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->controller(ApiAuthController::class)->group(function () {
    Route::post('send-otp', 'sendOtp');
    Route::post('verify-otp', 'verifyOtp');
    Route::post('register/{type}', 'register');
});
