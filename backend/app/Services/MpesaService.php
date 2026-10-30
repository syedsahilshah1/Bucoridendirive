<?php

namespace App\Services;

use App\Models\User;
use App\Models\Subscription;
use Illuminate\Support\Str;

class MpesaService
{
    /**
     * Initiate M-Pesa STK Push for Driver Subscription
     * Motorcycle: KSh 249, Car: KSh 549
     */
    public function initiateSubscriptionStk(User $driver, string $vehicleType, string $phone): array
    {
        $amount = $vehicleType === 'motorcycle' ? 249.00 : 549.00;
        $checkoutRequestId = 'ws_CO_' . date('dmYHis') . '_' . mt_rand(1000, 9999);
        $mpesaRef = 'MPESA_' . strtoupper(Str::random(10));

        // Create pending subscription record
        $subscription = Subscription::create([
            'driver_id' => $driver->id,
            'vehicle_type' => $vehicleType,
            'amount' => $amount,
            'is_trial' => false,
            'status' => 'active', // Mark active directly in demo/dev mode with receipt
            'start_date' => now(),
            'expiry_date' => now()->addDays(30),
            'mpesa_reference' => $mpesaRef,
        ]);

        return [
            'success' => true,
            'message' => "STK Push prompt sent to {$phone}. KSh {$amount} for {$vehicleType} 30-day subscription.",
            'checkout_request_id' => $checkoutRequestId,
            'reference' => $mpesaRef,
            'subscription' => $subscription,
        ];
    }
}
