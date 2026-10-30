<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Vehicle;
use App\Models\DriverProfile;
use App\Models\Subscription;
use App\Models\PricingSetting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Bolt Kenya Benchmark Pricing Engine Config
        PricingSetting::updateOrCreate(
            ['vehicle_type' => 'motorcycle'],
            [
                'service_category' => 'all',
                'base_fare' => 50.00,
                'rate_per_km' => 25.00,
                'rate_per_min' => 2.50,
                'minimum_fare' => 80.00,
            ]
        );

        PricingSetting::updateOrCreate(
            ['vehicle_type' => 'car'],
            [
                'service_category' => 'all',
                'base_fare' => 150.00,
                'rate_per_km' => 45.00,
                'rate_per_min' => 5.00,
                'minimum_fare' => 200.00,
            ]
        );

        // 2. Demo Administrator
        User::updateOrCreate(
            ['email' => 'admin@bucoride.com'],
            [
                'name' => 'BUCORIDE Administrator',
                'phone_number' => '+254700000001',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'home_town' => 'Nairobi',
                'free_ride_redeemed' => false,
                'is_active' => true,
            ]
        );

        // 3. Demo Motorcycle Driver (Boda)
        $bodaDriver = User::updateOrCreate(
            ['email' => 'driver.boda@bucoride.com'],
            [
                'name' => 'Juma Mwangi (Boda Boda)',
                'phone_number' => '+254712345678',
                'password' => Hash::make('password'),
                'role' => 'driver',
                'home_town' => 'Nairobi',
                'free_ride_redeemed' => false,
                'is_active' => true,
            ]
        );

        Vehicle::updateOrCreate(
            ['plate_number' => 'KMDF 452X'],
            [
                'driver_id' => $bodaDriver->id,
                'vehicle_type' => 'motorcycle',
                'service_category' => 'psv',
                'make_model' => 'Bajaj Boxer 150cc',
                'is_verified' => true,
            ]
        );

        DriverProfile::updateOrCreate(
            ['user_id' => $bodaDriver->id],
            [
                'is_online' => true,
                'current_lat' => -1.286389,
                'current_lng' => 36.817223,
                'current_address' => 'Kenyatta Avenue, Nairobi CBD',
                'sample_opportunities_count' => 12,
                'missed_opportunities_count' => 3,
                'sample_potential_earnings' => 3450.00,
                'last_seen_at' => now(),
            ]
        );

        Subscription::updateOrCreate(
            ['driver_id' => $bodaDriver->id],
            [
                'vehicle_type' => 'motorcycle',
                'amount' => 0.00,
                'is_trial' => true,
                'status' => 'active',
                'start_date' => now(),
                'expiry_date' => now()->addDays(28),
                'mpesa_reference' => 'TRIAL_ACTIVE_BODA',
            ]
        );

        // 4. Demo Car Driver (Private Hire / Chauffeur)
        $carDriver = User::updateOrCreate(
            ['email' => 'driver.car@bucoride.com'],
            [
                'name' => 'David Kiprono (Chauffeur)',
                'phone_number' => '+254722334455',
                'password' => Hash::make('password'),
                'role' => 'driver',
                'home_town' => 'Nairobi',
                'free_ride_redeemed' => false,
                'is_active' => true,
            ]
        );

        Vehicle::updateOrCreate(
            ['plate_number' => 'KDA 890Y'],
            [
                'driver_id' => $carDriver->id,
                'vehicle_type' => 'car',
                'service_category' => 'private_hire',
                'make_model' => 'Toyota Premio 1.8G',
                'is_verified' => true,
            ]
        );

        DriverProfile::updateOrCreate(
            ['user_id' => $carDriver->id],
            [
                'is_online' => true,
                'current_lat' => -1.292100,
                'current_lng' => 36.821900,
                'current_address' => 'Upper Hill, Nairobi',
                'sample_opportunities_count' => 8,
                'missed_opportunities_count' => 1,
                'sample_potential_earnings' => 4800.00,
                'last_seen_at' => now(),
            ]
        );

        Subscription::updateOrCreate(
            ['driver_id' => $carDriver->id],
            [
                'vehicle_type' => 'car',
                'amount' => 549.00,
                'is_trial' => false,
                'status' => 'active',
                'start_date' => now(),
                'expiry_date' => now()->addDays(24),
                'mpesa_reference' => 'QHJ899LM7P',
            ]
        );

        // 5. Demo Customer (Eligible for KSh 100 Free First Ride)
        User::updateOrCreate(
            ['email' => 'customer@bucoride.com'],
            [
                'name' => 'Grace Wanjiku',
                'phone_number' => '+254799887766',
                'password' => Hash::make('password'),
                'role' => 'customer',
                'home_town' => 'Nairobi',
                'free_ride_redeemed' => false,
                'is_active' => true,
            ]
        );
    }
}
