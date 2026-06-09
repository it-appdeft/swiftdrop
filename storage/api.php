<?php

use App\Http\Controllers\PropertyController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

// Protected: Extension endpoints
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/property', [PropertyController::class, 'search']);
    Route::post('/extension/fetch-property', [PropertyController::class, 'search']);
    // Route::post('/extension/fetch-property', [PropertyController::class, 'fetch']);

    Route::get('/extension/user', function (Request $request) {
        return response()->json([
            'name' => $request->user()->name,
            'email' => $request->user()->email,
        ]);
    });

    Route::post('/extension/logout', function (Request $request) {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    });

    Route::get('/extension/google-api-key', function () {
        return response()->json(['key' => config('services.google.maps_api_key')]);
    });
});

Route::middleware('auth:sanctum')->get('/extension/user', function (Request $request) {
    return response()->json([
        'user' => $request->user(),
    ]);
});
Route::get('/autocomplete', [PropertyController::class, 'autocomplete']);

// Route::middleware('auth:sanctum')->post('/fetch-property', [PropertyController::class, 'fetch']);
