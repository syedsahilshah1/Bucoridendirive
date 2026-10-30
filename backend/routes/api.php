<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\RideController;
use App\Http\Controllers\Api\ParcelController;
use App\Http\Controllers\Api\AdminController;

// Public Auth & Tracking Routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login'])->name('login');
});

// Public Tracking URL for Parcel Receivers & Senders
Route::get('/parcels/track/{token}', [ParcelController::class, 'trackByToken']);

// Public Fare Estimator (Available for Guests & Registered Users)
Route::post('/customer/estimate-fare', [CustomerController::class, 'estimateFare']);
Route::get('/pricing/estimate', [CustomerController::class, 'estimateFare']);

// Protected Authenticated Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/profile', [AuthController::class, 'profile']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Driver Routes
    Route::prefix('driver')->group(function () {
        Route::get('/dashboard', [DriverController::class, 'dashboard']);
        Route::post('/toggle-online', [DriverController::class, 'toggleOnline']);
        Route::post('/location', [DriverController::class, 'updateLocation']);
        Route::post('/activate-trial', [DriverController::class, 'activateTrial']);
        Route::post('/subscription/pay', [DriverController::class, 'paySubscription']);
        Route::post('/simulate-opportunity', [DriverController::class, 'simulateOpportunity']);
        Route::post('/vehicle', [DriverController::class, 'addVehicle']);
        Route::get('/available-requests', [RideController::class, 'availableRequests']);
        Route::get('/available-parcels', [ParcelController::class, 'availableParcels']);
    });

    // Customer Routes
    Route::prefix('customer')->group(function () {
        Route::get('/dashboard', [CustomerController::class, 'dashboard']);
        Route::post('/update-location', [CustomerController::class, 'updateLocation']);
    });

    // Rides & Negotiation Routes
    Route::prefix('rides')->group(function () {
        Route::post('/', [RideController::class, 'requestRide']);
        Route::get('/{id}', [RideController::class, 'show']);
        Route::post('/{id}/counter', [RideController::class, 'counterFare']);
        Route::post('/{id}/accept', [RideController::class, 'acceptRide']);
        Route::post('/{id}/status', [RideController::class, 'updateStatus']);
    });

    // Parcel Deliveries
    Route::prefix('parcels')->group(function () {
        Route::post('/', [ParcelController::class, 'createParcel']);
        Route::post('/{id}/accept', [ParcelController::class, 'acceptParcel']);
        Route::post('/{id}/status', [ParcelController::class, 'updateStatus']);
    });

    // Administration Console
    Route::prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/drivers', [AdminController::class, 'drivers']);
        Route::get('/customers', [AdminController::class, 'customers']);
        Route::post('/users/{id}/toggle-status', [AdminController::class, 'toggleUserStatus']);
        Route::post('/pricing', [AdminController::class, 'updatePricing']);
        Route::post('/customers/{id}/reset-free-ride', [AdminController::class, 'resetFreeRide']);
    });
});
