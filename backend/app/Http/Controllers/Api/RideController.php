<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ride;
use App\Models\User;
use App\Models\DeviceFingerprint;
use App\Services\FareCalculatorService;
use App\Events\RideRequested;
use App\Events\RideNegotiated;
use App\Events\RideStatusUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RideController extends Controller
{
    /**
     * Customer Creates a Ride Booking Request
     */
    public function requestRide(Request $request, FareCalculatorService $calculator)
    {
        $request->validate([
            'vehicle_type' => 'required|in:motorcycle,car',
            'pickup_address' => 'required|string',
            'pickup_lat' => 'required|numeric',
            'pickup_lng' => 'required|numeric',
            'destination_address' => 'required|string',
            'destination_lat' => 'required|numeric',
            'destination_lng' => 'required|numeric',
            'distance_km' => 'required|numeric|min:0.1',
            'proposed_fare' => 'nullable|numeric|min:20',
        ]);

        $user = $request->user();
        $distanceKm = (float) $request->distance_km;
        $durationMin = $calculator->calculateDurationMinutes($distanceKm);
        $fareData = $calculator->calculateFare($request->vehicle_type, $distanceKm, $durationMin);
        $estimatedFare = $fareData['final_fare'];

        // Initial proposed fare (customer may propose custom or keep estimated)
        $proposedFare = $request->proposed_fare ? (float) $request->proposed_fare : $estimatedFare;

        $ride = Ride::create([
            'customer_id' => $user->id,
            'driver_id' => null,
            'vehicle_type' => $request->vehicle_type,
            'pickup_address' => $request->pickup_address,
            'pickup_lat' => $request->pickup_lat,
            'pickup_lng' => $request->pickup_lng,
            'destination_address' => $request->destination_address,
            'destination_lat' => $request->destination_lat,
            'destination_lng' => $request->destination_lng,
            'distance_km' => $distanceKm,
            'duration_min' => $durationMin,
            'estimated_fare' => $estimatedFare,
            'proposed_fare' => $proposedFare,
            'status' => 'requested',
        ]);

        // Broadcast to all eligible online drivers via Reverb
        broadcast(new RideRequested($ride));

        return response()->json([
            'success' => true,
            'message' => 'Ride request broadcasted to nearest eligible drivers.',
            'ride' => $ride->load('customer'),
        ], 201);
    }

    /**
     * Driver or Customer Bidding / Counteroffer
     */
    public function counterFare(Request $request, $id)
    {
        $request->validate([
            'counter_fare' => 'required|numeric|min:20',
        ]);

        $ride = Ride::findOrFail($id);
        $user = $request->user();

        if ($ride->status === 'completed' || $ride->status === 'cancelled') {
            return response()->json(['success' => false, 'message' => 'Ride is already terminated.'], 400);
        }

        $counterBy = ($user->role === 'driver') ? 'driver' : 'customer';

        $ride->counter_fare = $request->counter_fare;
        $ride->counter_by = $counterBy;
        $ride->status = 'negotiating';

        if ($user->role === 'driver' && !$ride->driver_id) {
            $ride->driver_id = $user->id;
        }

        $ride->save();

        broadcast(new RideNegotiated($ride, "{$counterBy} made a counteroffer of KSh {$request->counter_fare}"));

        return response()->json([
            'success' => true,
            'message' => "Counteroffer of KSh {$request->counter_fare} submitted.",
            'ride' => $ride->load(['customer', 'driver.vehicles', 'driver.driverProfile']),
        ]);
    }

    /**
     * Accept Ride & Lock Fare (Prevents Multiple Drivers Accepting)
     */
    public function acceptRide(Request $request, $id, FareCalculatorService $calculator)
    {
        return DB::transaction(function () use ($request, $id, $calculator) {
            $ride = Ride::lockForUpdate()->findOrFail($id);
            $user = $request->user();

            if ($ride->driver_id && $ride->driver_id !== $user->id && $ride->status !== 'requested') {
                return response()->json([
                    'success' => false,
                    'message' => 'This ride has already been accepted by another driver.',
                ], 409);
            }

            // Driver must have active subscription and be online
            if ($user->role === 'driver') {
                $activeSub = $user->activeSubscription;
                if (!$activeSub || !$activeSub->isValid()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'You must have an active subscription or free trial to accept customer bookings.',
                    ], 403);
                }

                $ride->driver_id = $user->id;
            }

            // Lock final fare
            $finalFare = $ride->counter_fare ?? $ride->proposed_fare ?? $ride->estimated_fare;
            $ride->agreed_fare = $finalFare;

            // Apply Customer 1-time Free Ride Voucher (Up to KSh 100)
            $customer = $ride->customer;
            $deviceHash = $request->header('X-Device-Fingerprint');
            $deviceRedeemed = false;
            if ($deviceHash) {
                $device = DeviceFingerprint::where('device_hash', $deviceHash)->first();
                $deviceRedeemed = $device ? (bool) $device->free_ride_redeemed : false;
            }

            $isEligible = $customer && !$customer->free_ride_redeemed && !$deviceRedeemed;
            $discountData = $calculator->applyFreeRideDiscount($finalFare, $isEligible);

            $ride->free_ride_subsidy = $discountData['subsidy'];
            $ride->customer_payable_fare = $discountData['customer_payable'];
            $ride->status = 'accepted';
            $ride->save();

            // Mark voucher redeemed
            if ($discountData['free_ride_applied'] && $customer) {
                $customer->free_ride_redeemed = true;
                $customer->save();

                if ($deviceHash) {
                    DeviceFingerprint::updateOrCreate(
                        ['device_hash' => $deviceHash],
                        [
                            'user_id' => $customer->id,
                            'free_ride_redeemed' => true,
                            'redeemed_at' => now(),
                        ]
                    );
                }
            }

            broadcast(new RideStatusUpdated($ride));

            return response()->json([
                'success' => true,
                'message' => 'Ride accepted and matched successfully.',
                'ride' => $ride->load(['customer', 'driver.vehicles', 'driver.driverProfile']),
            ]);
        });
    }

    /**
     * Driver updates ride journey status: arrived, in_progress, completed
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:arrived,in_progress,completed,cancelled',
        ]);

        $ride = Ride::findOrFail($id);
        $ride->status = $request->status;

        if ($request->status === 'completed') {
            $ride->completed_at = now();
            $ride->payment_status = 'paid';
        }

        $ride->save();

        broadcast(new RideStatusUpdated($ride));

        return response()->json([
            'success' => true,
            'message' => "Ride status transitioned to {$request->status}.",
            'ride' => $ride->load(['customer', 'driver.vehicles', 'driver.driverProfile']),
        ]);
    }

    /**
     * Get Single Ride Details (Live tracking)
     */
    public function show($id)
    {
        $ride = Ride::with(['customer', 'driver.vehicles', 'driver.driverProfile'])->findOrFail($id);
        return response()->json(['success' => true, 'ride' => $ride]);
    }

    /**
     * List Available Requests for Online Drivers
     */
    public function availableRequests(Request $request)
    {
        $user = $request->user();
        $vehicle = $user->vehicles()->first();
        $vehicleType = $vehicle ? $vehicle->vehicle_type : null;

        $query = Ride::where('status', 'requested')
            ->whereNull('driver_id');

        if ($vehicleType) {
            $query->where('vehicle_type', $vehicleType);
        }

        $rides = $query->with('customer')->latest()->take(15)->get();

        return response()->json(['success' => true, 'rides' => $rides]);
    }
}
