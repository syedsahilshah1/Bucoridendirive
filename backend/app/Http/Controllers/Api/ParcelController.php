<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Parcel;
use App\Services\FareCalculatorService;
use App\Events\ParcelStatusUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ParcelController extends Controller
{
    /**
     * Customer Creates Parcel Delivery Request
     */
    public function createParcel(Request $request, FareCalculatorService $calculator)
    {
        $request->validate([
            'sender_name' => 'required|string|max:100',
            'sender_phone' => 'required|string|max:20',
            'receiver_name' => 'required|string|max:100',
            'receiver_phone' => 'required|string|max:20',
            'parcel_description' => 'required|string|max:255',
            'pickup_address' => 'required|string',
            'pickup_lat' => 'required|numeric',
            'pickup_lng' => 'required|numeric',
            'delivery_address' => 'required|string',
            'delivery_lat' => 'required|numeric',
            'delivery_lng' => 'required|numeric',
            'distance_km' => 'required|numeric|min:0.1',
        ]);

        $distanceKm = (float) $request->distance_km;
        $durationMin = $calculator->calculateDurationMinutes($distanceKm);

        // Parcels benchmarked at motorcycle rate + 20 KSh handling
        $fareData = $calculator->calculateFare('motorcycle', $distanceKm, $durationMin);
        $deliveryFare = $fareData['final_fare'] + 20.00;

        $trackingToken = Str::random(32);

        $parcel = Parcel::create([
            'customer_id' => $request->user()->id,
            'driver_id' => null,
            'sender_name' => $request->sender_name,
            'sender_phone' => $request->sender_phone,
            'receiver_name' => $request->receiver_name,
            'receiver_phone' => $request->receiver_phone,
            'parcel_description' => $request->parcel_description,
            'pickup_address' => $request->pickup_address,
            'pickup_lat' => $request->pickup_lat,
            'pickup_lng' => $request->pickup_lng,
            'delivery_address' => $request->delivery_address,
            'delivery_lat' => $request->delivery_lat,
            'delivery_lng' => $request->delivery_lng,
            'distance_km' => $distanceKm,
            'estimated_fare' => $deliveryFare,
            'tracking_token' => $trackingToken,
            'status' => 'pending',
        ]);

        broadcast(new ParcelStatusUpdated($parcel));

        return response()->json([
            'success' => true,
            'message' => 'Parcel delivery requested. Nearest riders notified.',
            'parcel' => $parcel,
            'tracking_url' => url("/track/{$trackingToken}"),
        ], 201);
    }

    /**
     * Driver / Rider Accepts Parcel
     */
    public function acceptParcel(Request $request, $id)
    {
        $parcel = Parcel::findOrFail($id);
        $user = $request->user();

        if ($parcel->driver_id && $parcel->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Parcel already accepted by another rider.'], 409);
        }

        $activeSub = $user->activeSubscription;
        if (!$activeSub || !$activeSub->isValid()) {
            return response()->json(['success' => false, 'message' => 'Active subscription required to accept parcel deliveries.'], 403);
        }

        $parcel->driver_id = $user->id;
        $parcel->status = 'accepted';
        $parcel->save();

        broadcast(new ParcelStatusUpdated($parcel));

        return response()->json([
            'success' => true,
            'message' => 'Parcel delivery accepted.',
            'parcel' => $parcel->load(['customer', 'driver.vehicles', 'driver.driverProfile']),
        ]);
    }

    /**
     * Driver Updates Parcel Delivery Milestone & Live Location
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:collected,in_transit,delivered,cancelled',
            'current_lat' => 'nullable|numeric',
            'current_lng' => 'nullable|numeric',
        ]);

        $parcel = Parcel::findOrFail($id);
        $parcel->status = $request->status;
        $parcel->save();

        broadcast(new ParcelStatusUpdated($parcel, $request->current_lat, $request->current_lng));

        return response()->json([
            'success' => true,
            'message' => "Parcel milestone updated to {$request->status}.",
            'parcel' => $parcel->load(['customer', 'driver.vehicles', 'driver.driverProfile']),
        ]);
    }

    /**
     * Public Tracking View (No Authentication Needed)
     */
    public function trackByToken($token)
    {
        $parcel = Parcel::where('tracking_token', $token)
            ->with(['driver.vehicles', 'driver.driverProfile'])
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'parcel' => $parcel,
            'rider_location' => $parcel->driver && $parcel->driver->driverProfile ? [
                'lat' => $parcel->driver->driverProfile->current_lat,
                'lng' => $parcel->driver->driverProfile->current_lng,
                'address' => $parcel->driver->driverProfile->current_address,
                'name' => $parcel->driver->name,
                'phone' => $parcel->driver->phone_number,
                'vehicle' => $parcel->driver->vehicles->first(),
            ] : null,
        ]);
    }

    /**
     * Available Parcel Requests for Riders
     */
    public function availableParcels(Request $request)
    {
        $parcels = Parcel::where('status', 'pending')
            ->whereNull('driver_id')
            ->latest()
            ->take(15)
            ->get();

        return response()->json(['success' => true, 'parcels' => $parcels]);
    }
}
