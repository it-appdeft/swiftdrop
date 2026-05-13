<?php

use App\Http\Controllers\Auth\AuthController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::controller(AuthController::class)->middleware('guest')->group(function () {
    Route::get('/login', 'login')->name('login');
    Route::get('/register', 'register')->name('register');
    Route::get('/otp', 'otp')->name('otp');

    Route::post('/otp/send', 'sendOtp')->name('otp.send');
    Route::post('/otp/verify', 'verifyOtp')->name('otp.verify');
    Route::post('/register/customer', 'registerCustomer')->name('register.customer');
    Route::post('/register/restaurant', 'registerRestaurant')->name('register.restaurant');
});


require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/admin.php';
require __DIR__.'/customer.php';
require __DIR__.'/restaurant.php';
