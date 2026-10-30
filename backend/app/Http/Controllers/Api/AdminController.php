<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\Subscription;
use App\Models\PricingSetting;
use App\Models\Ride;
use App\Models\Parcel;
use App\Models\DeviceFingerprint;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * Admin Overview Analytics & Metrics
     */
    public function dashboard()
    {
        $totalDrivers = User::where('role', 'driver')->count();
        $totalCustomers = User::where('role', 'customer')->count();
        $totalVehicles = Vehicle::count();

        $activeSubscriptions = Subscription::where('status', 'active')
            ->where('expiry_date', '>', now())
            ->count();

        $subscriptionRevenue = Subscription::where('status', 'active')->sum('amount');
        $rideRevenue = Ride::where('status', 'completed')->sum('agreed_fare');
        $parcelRevenue = Parcel::where('status', 'delivered')->sum('estimated_fare');

        $activeOnlineDrivers = User::where('role', 'driver')
            ->whereHas('driverProfile', fn($q) => $q->where('is_online', true))
            ->with(['driverProfile', 'vehicles', 'activeSubscription'])
            ->get();

        $duplicateDevices = DeviceFingerprint::select('device_hash')
            ->selectRaw('count(*) as count')
            ->groupBy('device_hash')
            ->having('count', '>', 1)
            ->with('user')
            ->get();

        return response()->json([
            'success' => true,
            'metrics' => [
                'total_drivers' => $totalDrivers,
                'total_customers' => $totalCustomers,
                'total_vehicles' => $totalVehicles,
                'active_subscriptions' => $activeSubscriptions,
                'subscription_revenue_ksh' => (float) $subscriptionRevenue,
                'rides_completed_revenue_ksh' => (float) $rideRevenue,
                'parcels_delivered_revenue_ksh' => (float) $parcelRevenue,
                'total_ecosystem_volume_ksh' => (float) ($subscriptionRevenue + $rideRevenue + $parcelRevenue),
            ],
            'online_fleet' => $activeOnlineDrivers,
            'duplicate_devices_count' => $duplicateDevices->count(),
            'pricing_settings' => PricingSetting::all(),
        ]);
    }

    /**
     * Driver List & Management
     */
    public function drivers()
    {
        $drivers = User::where('role', 'driver')
            ->with(['vehicles', 'driverProfile', 'subscriptions', 'activeSubscription'])
            ->latest()
            ->get();

        return response()->json(['success' => true, 'drivers' => $drivers]);
    }

    /**
     * Toggle User Account Suspension (Drivers or Customers)
     */
    public function toggleUserStatus($id)
    {
        $user = User::findOrFail($id);
        $user->is_active = !$user->is_active;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => $user->is_active ? 'Account activated.' : 'Account suspended.',
            'is_active' => $user->is_active,
        ]);
    }

    /**
     * Customers and Anti-Abuse Device Registry
     */
    public function customers()
    {
        $customers = User::where('role', 'customer')
            ->withCount(['customerRides', 'customerParcels'])
            ->latest()
            ->get();

        $deviceFingerprints = DeviceFingerprint::with('user')->latest()->take(50)->get();

        return response()->json([
            'success' => true,
            'customers' => $customers,
            'device_fingerprints' => $deviceFingerprints,
        ]);
    }

    /**
     * Update Pricing Engine Configuration
     */
    public function updatePricing(Request $request)
    {
        $request->validate([
            'vehicle_type' => 'required|in:motorcycle,car',
            'base_fare' => 'required|numeric|min:0',
            'rate_per_km' => 'required|numeric|min:0',
            'rate_per_min' => 'required|numeric|min:0',
            'minimum_fare' => 'required|numeric|min:0',
        ]);

        $setting = PricingSetting::updateOrCreate(
            ['vehicle_type' => $request->vehicle_type],
            [
                'base_fare' => $request->base_fare,
                'rate_per_km' => $request->rate_per_km,
                'rate_per_min' => $request->rate_per_min,
                'minimum_fare' => $request->minimum_fare,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "Pricing updated for {$request->vehicle_type}.",
            'setting' => $setting,
        ]);
    }

    /**
     * Reset Customer Free Ride Voucher (Admin Override)
     */
    public function resetFreeRide($id)
    {
        $user = User::findOrFail($id);
        $user->free_ride_redeemed = false;
        $user->save();

        DeviceFingerprint::where('user_id', $user->id)->update(['free_ride_redeemed' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Free ride voucher eligibility reset for customer.',
        ]);
    }
}
