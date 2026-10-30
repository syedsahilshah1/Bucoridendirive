<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Models\Subscription;
use App\Models\Ride;
use App\Models\Parcel;
use App\Models\SampleOpportunity;
use App\Services\MpesaService;
use App\Services\OpportunitySimulatorService;
use App\Events\DriverLocationUpdated;
use Illuminate\Http\Request;

class DriverController extends Controller
{
    /**
     * Get Driver Dashboard Data
     */
    public function dashboard(Request $request)
    {
        $user = $request->user()->load(['vehicles', 'driverProfile', 'activeSubscription', 'subscriptions']);
        $profile = $user->driverProfile;
        $activeSub = $user->activeSubscription;

        // Genuine customer rides
        $assignedRides = Ride::where('driver_id', $user->id)
            ->whereIn('status', ['accepted', 'arrived', 'in_progress'])
            ->with('customer')
            ->get();

        $completedRidesCount = Ride::where('driver_id', $user->id)
            ->where('status', 'completed')
            ->count();

        $totalEarnings = Ride::where('driver_id', $user->id)
            ->where('status', 'completed')
            ->sum('agreed_fare');

        // Genuine parcel deliveries
        $activeParcels = Parcel::where('driver_id', $user->id)
            ->whereIn('status', ['accepted', 'collected', 'in_transit'])
            ->get();

        $completedDeliveriesCount = Parcel::where('driver_id', $user->id)
            ->where('status', 'delivered')
            ->count();

        // Sample opportunities
        $sampleOpportunities = SampleOpportunity::where('driver_id', $user->id)
            ->latest()
            ->take(10)
            ->get();

        // Available open booking requests (unassigned)
        $vehicle = $user->vehicles()->first();
        $vehicleType = $vehicle ? $vehicle->vehicle_type : null;
        $availableRidesQuery = Ride::where('status', 'requested')
            ->whereNull('driver_id')
            ->with('customer')
            ->latest();
        if ($vehicleType) {
            $availableRidesQuery->where('vehicle_type', $vehicleType);
        }
        $availableRides = $availableRidesQuery->take(20)->get();

        // Available pending parcel deliveries (unassigned)
        $availableParcels = Parcel::where('status', 'pending')
            ->whereNull('driver_id')
            ->latest()
            ->take(20)
            ->get();

        return response()->json([
            'success' => true,
            'driver' => $user,
            'profile' => $profile,
            'subscription' => $activeSub,
            'is_eligible_for_bookings' => $activeSub && $activeSub->isValid() && $profile && $profile->is_online,
            'available_rides' => $availableRides,
            'available_parcels' => $availableParcels,
            'active_rides' => $assignedRides,
            'completed_rides_count' => $completedRidesCount,
            'total_earnings_ksh' => (float) $totalEarnings,
            'active_parcels' => $activeParcels,
            'completed_deliveries_count' => $completedDeliveriesCount,
            'sample_opportunities' => $sampleOpportunities,
            'sample_stats' => [
                'total_received' => $profile ? $profile->sample_opportunities_count : 0,
                'missed_count' => $profile ? $profile->missed_opportunities_count : 0,
                'potential_earnings_ksh' => $profile ? (float) $profile->sample_potential_earnings : 0.00,
            ],
        ]);
    }

    /**
     * Switch Online / Offline Status
     */
    public function toggleOnline(Request $request)
    {
        $user = $request->user();
        $profile = $user->driverProfile;

        if (!$profile) {
            return response()->json(['success' => false, 'message' => 'Driver profile not found.'], 404);
        }

        $activeSub = $user->activeSubscription;

        // Check subscription if attempting to go online
        if (!$profile->is_online && (!$activeSub || !$activeSub->isValid())) {
            return response()->json([
                'success' => false,
                'message' => 'Active subscription or free trial activation required to go online and receive customer bookings.',
                'requires_subscription' => true,
            ], 403);
        }

        $profile->is_online = !$profile->is_online;
        $profile->last_seen_at = now();
        $profile->save();

        return response()->json([
            'success' => true,
            'is_online' => $profile->is_online,
            'message' => $profile->is_online ? 'Driver is now ONLINE.' : 'Driver is now OFFLINE.',
        ]);
    }

    /**
     * Update Live GPS Location
     */
    public function updateLocation(Request $request)
    {
        $request->validate([
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
            'address' => 'nullable|string',
        ]);

        $user = $request->user();
        $profile = $user->driverProfile;

        if ($profile) {
            $profile->current_lat = $request->lat;
            $profile->current_lng = $request->lng;
            if ($request->address) {
                $profile->current_address = $request->address;
            }
            $profile->last_seen_at = now();
            $profile->save();

            $vehicle = $user->vehicles()->first();
            $vehicleType = $vehicle ? $vehicle->vehicle_type : 'car';

            // Broadcast to Reverb if driver is online
            if ($profile->is_online) {
                broadcast(new DriverLocationUpdated(
                    $user->id,
                    $user->name,
                    $vehicleType,
                    $request->lat,
                    $request->lng,
                    $profile->current_address
                ));
            }
        }

        return response()->json(['success' => true, 'profile' => $profile]);
    }

    /**
     * Activate 1-Month Free Trial Subscription
     */
    public function activateTrial(Request $request)
    {
        $user = $request->user();
        $hasHadTrial = Subscription::where('driver_id', $user->id)->where('is_trial', true)->exists();

        if ($hasHadTrial) {
            return response()->json(['success' => false, 'message' => 'Free trial has already been claimed for this account.'], 400);
        }

        $vehicle = $user->vehicles()->first();
        $vehicleType = $vehicle ? $vehicle->vehicle_type : 'motorcycle';

        $subscription = Subscription::create([
            'driver_id' => $user->id,
            'vehicle_type' => $vehicleType,
            'amount' => 0.00,
            'is_trial' => true,
            'status' => 'active',
            'start_date' => now(),
            'expiry_date' => now()->addDays(30),
            'mpesa_reference' => 'TRIAL_FREE_MONTH',
        ]);

        return response()->json([
            'success' => true,
            'message' => '1-Month Free Trial activated successfully! You are now eligible to accept customer bookings.',
            'subscription' => $subscription,
        ]);
    }

    /**
     * Renew Subscription via Safaricom M-Pesa STK Push
     */
    public function paySubscription(Request $request, MpesaService $mpesaService)
    {
        $request->validate([
            'phone' => 'required|string',
            'vehicle_type' => 'required|in:motorcycle,car',
        ]);

        $user = $request->user();
        $result = $mpesaService->initiateSubscriptionStk($user, $request->vehicle_type, $request->phone);

        return response()->json($result);
    }

    /**
     * Trigger / Simulate Ride Opportunity (Driver Training & Retention)
     */
    public function simulateOpportunity(Request $request, OpportunitySimulatorService $simulator)
    {
        $opportunity = $simulator->generateForDriver($request->user());

        if (!$opportunity) {
            return response()->json([
                'success' => false,
                'message' => 'Driver must be online with an active profile to generate simulated opportunities.',
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'Sample ride opportunity dispatched successfully.',
            'opportunity' => $opportunity,
        ]);
    }

    /**
     * Manage Registered Vehicles
     */
    public function addVehicle(Request $request)
    {
        $request->validate([
            'vehicle_type' => 'required|in:car,motorcycle',
            'service_category' => 'required|in:private_hire,psv',
            'make_model' => 'required|string|max:100',
            'plate_number' => 'required|string|max:20|unique:vehicles,plate_number',
        ]);

        $vehicle = Vehicle::create([
            'driver_id' => $request->user()->id,
            'vehicle_type' => $request->vehicle_type,
            'service_category' => $request->service_category,
            'make_model' => $request->make_model,
            'plate_number' => strtoupper(trim($request->plate_number)),
            'is_verified' => true,
        ]);

        return response()->json(['success' => true, 'vehicle' => $vehicle]);
    }
}
