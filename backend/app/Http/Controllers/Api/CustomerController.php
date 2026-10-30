<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeviceFingerprint;
use App\Models\Ride;
use App\Models\Parcel;
use App\Services\FareCalculatorService;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    /**
     * Customer Dashboard Data
     */
    public function dashboard(Request $request, FareCalculatorService $calculator)
    {
        $user = $request->user();

        // Check Anti-Abuse Free Ride Eligibility
        $deviceHash = $request->header('X-Device-Fingerprint');
        $deviceRedeemed = false;
        if ($deviceHash) {
            $device = DeviceFingerprint::where('device_hash', $deviceHash)->first();
            $deviceRedeemed = $device ? (bool) $device->free_ride_redeemed : false;
        }

        $freeRideEligible = !$user->free_ride_redeemed && !$deviceRedeemed;

        // Ongoing rides
        $activeRides = Ride::where('customer_id', $user->id)
            ->whereIn('status', ['requested', 'negotiating', 'accepted', 'arrived', 'in_progress'])
            ->with(['driver.vehicles', 'driver.driverProfile'])
            ->get();

        // Past rides
        $pastRides = Ride::where('customer_id', $user->id)
            ->whereIn('status', ['completed', 'cancelled'])
            ->with('driver')
            ->latest()
            ->take(10)
            ->get();

        // Active parcels
        $activeParcels = Parcel::where('customer_id', $user->id)
            ->whereIn('status', ['pending', 'accepted', 'collected', 'in_transit'])
            ->with('driver')
            ->get();

        return response()->json([
            'success' => true,
            'customer' => $user,
            'free_ride_voucher' => [
                'eligible' => $freeRideEligible,
                'max_discount_ksh' => 100.00,
                'description' => 'BUCORIDE Welcome Gift: Up to KSh 100 off your first trip.',
                'status' => $freeRideEligible ? 'AVAILABLE' : 'REDEEMED_OR_INELIGIBLE',
            ],
            'active_rides' => $activeRides,
            'past_rides' => $pastRides,
            'active_parcels' => $activeParcels,
        ]);
    }

    /**
     * Fare Estimation Endpoint
     */
    public function estimateFare(Request $request, FareCalculatorService $calculator)
    {
        $request->validate([
            'distance_km' => 'required|numeric|min:0.1',
            'vehicle_type' => 'required|in:motorcycle,car',
        ]);

        $distanceKm = (float) $request->distance_km;
        $vehicleType = $request->vehicle_type;

        $durationMin = $calculator->calculateDurationMinutes($distanceKm);
        $fareData = $calculator->calculateFare($vehicleType, $distanceKm, $durationMin);

        // Check free ride voucher
        $user = $request->user();
        $deviceHash = $request->header('X-Device-Fingerprint');
        $deviceRedeemed = false;
        if ($deviceHash) {
            $device = DeviceFingerprint::where('device_hash', $deviceHash)->first();
            $deviceRedeemed = $device ? (bool) $device->free_ride_redeemed : false;
        }

        $eligible = $user ? (!$user->free_ride_redeemed && !$deviceRedeemed) : false;
        $discountData = $calculator->applyFreeRideDiscount($fareData['final_fare'], $eligible);

        return response()->json([
            'success' => true,
            'distance_km' => $distanceKm,
            'duration_min' => $durationMin,
            'speed_cruising_kmh' => 60,
            'estimated_fare' => $fareData['final_fare'],
            'pricing_breakdown' => $fareData,
            'free_ride' => $discountData,
        ]);
    }

    /**
     * Update Customer Home Town & Location
     */
    public function updateLocation(Request $request)
    {
        $request->validate([
            'home_town' => 'nullable|string|max:100',
        ]);

        $user = $request->user();
        if ($request->home_town) {
            $user->home_town = $request->home_town;
            $user->save();
        }

        return response()->json(['success' => true, 'user' => $user]);
    }
}
