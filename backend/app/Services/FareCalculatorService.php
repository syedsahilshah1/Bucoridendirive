<?php

namespace App\Services;

use App\Models\PricingSetting;

class FareCalculatorService
{
    /**
     * Calculate journey duration based on initial cruising speed 60 KM/H
     * Formula: Distance / 60 * 60 minutes = Distance in minutes
     */
    public function calculateDurationMinutes(float $distanceKm): int
    {
        // 60 km/h cruising speed formula
        $minutes = ($distanceKm / 60.0) * 60.0;
        return max(3, (int) round($minutes));
    }

    /**
     * Calculate fare using benchmarked Bolt Kenya rates
     */
    public function calculateFare(string $vehicleType, float $distanceKm, int $durationMin): array
    {
        $setting = PricingSetting::where('vehicle_type', $vehicleType)->first();

        // Defaults if table missing
        $baseFare = $setting ? (float) $setting->base_fare : ($vehicleType === 'motorcycle' ? 50.0 : 150.0);
        $ratePerKm = $setting ? (float) $setting->rate_per_km : ($vehicleType === 'motorcycle' ? 25.0 : 45.0);
        $ratePerMin = $setting ? (float) $setting->rate_per_min : ($vehicleType === 'motorcycle' ? 2.5 : 5.0);
        $minimumFare = $setting ? (float) $setting->minimum_fare : ($vehicleType === 'motorcycle' ? 80.0 : 200.0);

        $computedFare = $baseFare + ($distanceKm * $ratePerKm) + ($durationMin * $ratePerMin);
        $finalFare = round(max($minimumFare, $computedFare), 0);

        return [
            'base_fare' => $baseFare,
            'rate_per_km' => $ratePerKm,
            'rate_per_min' => $ratePerMin,
            'minimum_fare' => $minimumFare,
            'final_fare' => $finalFare,
        ];
    }

    /**
     * Calculate Customer Free Ride Discount (Up to KSh 100)
     */
    public function applyFreeRideDiscount(float $agreedOrEstimatedFare, bool $isEligible): array
    {
        if (!$isEligible) {
            return [
                'subsidy' => 0.0,
                'customer_payable' => $agreedOrEstimatedFare,
                'free_ride_applied' => false,
            ];
        }

        $subsidy = min(100.0, $agreedOrEstimatedFare);
        $customerPayable = max(0.0, $agreedOrEstimatedFare - $subsidy);

        return [
            'subsidy' => $subsidy,
            'customer_payable' => $customerPayable,
            'free_ride_applied' => true,
        ];
    }
}
