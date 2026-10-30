<?php

namespace App\Services;

use App\Models\User;
use App\Models\SampleOpportunity;
use App\Events\SampleOpportunityDispatched;

class OpportunitySimulatorService
{
    protected array $sampleLocations = [
        ['address' => 'Westlands Mall, Nairobi', 'lat' => -1.2683, 'lng' => 36.8048],
        ['address' => 'JKIA Terminal 1A, Embakasi', 'lat' => -1.3192, 'lng' => 36.9275],
        ['address' => 'Two Rivers Mall, Limuru Rd', 'lat' => -1.2155, 'lng' => 36.7997],
        ['address' => 'Upper Hill Medical Plaza', 'lat' => -1.2995, 'lng' => 36.8182],
        ['address' => 'Kilimani, Yaya Centre', 'lat' => -1.2932, 'lng' => 36.7885],
        ['address' => 'Kenyatta National Hospital', 'lat' => -1.3015, 'lng' => 36.8078],
        ['address' => 'Karen Shopping Centre', 'lat' => -1.3197, 'lng' => 36.7064],
        ['address' => 'South B Shopping Center', 'lat' => -1.3106, 'lng' => 36.8394],
        ['address' => 'Thika Road Mall (TRM), Roysambu', 'lat' => -1.2185, 'lng' => 36.8893],
        ['address' => 'Ngong Road, Junction Mall', 'lat' => -1.2989, 'lng' => 36.7622],
    ];

    public function generateForDriver(User $driver): ?SampleOpportunity
    {
        $profile = $driver->driverProfile;
        if (!$profile || !$profile->is_online) {
            return null;
        }

        // Pick two distinct random locations
        $pickup = $this->sampleLocations[array_rand($this->sampleLocations)];
        do {
            $dest = $this->sampleLocations[array_rand($this->sampleLocations)];
        } while ($dest['address'] === $pickup['address']);

        $distanceKm = round(mt_rand(30, 220) / 10.0, 1); // 3.0 to 22.0 KM
        $vehicle = $driver->vehicles()->first();
        $isMotorcycle = $vehicle && $vehicle->vehicle_type === 'motorcycle';

        $rate = $isMotorcycle ? 30.0 : 60.0;
        $base = $isMotorcycle ? 60.0 : 180.0;
        $estimatedFare = round($base + ($distanceKm * $rate), 0);

        $opportunity = SampleOpportunity::create([
            'driver_id' => $driver->id,
            'pickup_address' => $pickup['address'],
            'destination_address' => $dest['address'],
            'distance_km' => $distanceKm,
            'estimated_fare' => $estimatedFare,
            'status' => 'generated',
        ]);

        // Increment driver profile sample opportunity telemetry
        $profile->increment('sample_opportunities_count');
        $profile->increment('missed_opportunities_count');
        $profile->sample_potential_earnings = (float) $profile->sample_potential_earnings + $estimatedFare;
        $profile->save();

        // Broadcast to driver via Reverb
        broadcast(new SampleOpportunityDispatched($opportunity));

        return $opportunity;
    }
}
