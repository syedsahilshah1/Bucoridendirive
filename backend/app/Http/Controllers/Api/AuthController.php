<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\DriverProfile;
use App\Models\DeviceFingerprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Customer and Driver Registration
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:120',
            'email' => 'required|string|email|max:120|unique:users',
            'phone_number' => 'required|string|max:20|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'required|in:customer,driver',
            'home_town' => 'nullable|string|max:100',
            'device_fingerprint' => 'nullable|string|max:255',

            // Conditional validation for drivers
            'vehicle_type' => 'required_if:role,driver|in:car,motorcycle',
            'service_category' => 'required_if:role,driver|in:private_hire,psv',
            'vehicle_model' => 'required_if:role,driver|string|max:100',
            'plate_number' => 'required_if:role,driver|string|max:20|unique:vehicles,plate_number',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone_number' => $request->phone_number,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'home_town' => $request->home_town ?? 'Nairobi',
            'free_ride_redeemed' => false,
            'is_active' => true,
        ]);

        // Register Driver profile and vehicle
        if ($user->role === 'driver') {
            Vehicle::create([
                'driver_id' => $user->id,
                'vehicle_type' => $request->vehicle_type,
                'service_category' => $request->service_category,
                'make_model' => $request->vehicle_model,
                'plate_number' => strtoupper(trim($request->plate_number)),
                'is_verified' => true,
            ]);

            DriverProfile::create([
                'user_id' => $user->id,
                'is_online' => false,
                'current_lat' => -1.286389,
                'current_lng' => 36.817223,
                'current_address' => 'Nairobi CBD',
                'sample_opportunities_count' => 0,
                'missed_opportunities_count' => 0,
                'sample_potential_earnings' => 0.00,
            ]);
        }

        // Anti-abuse device fingerprint registration
        $deviceHash = $request->header('X-Device-Fingerprint', $request->device_fingerprint);
        if ($deviceHash) {
            DeviceFingerprint::firstOrCreate(
                ['device_hash' => $deviceHash],
                [
                    'user_id' => $user->id,
                    'free_ride_redeemed' => false,
                    'ip_address' => $request->ip(),
                ]
            );
        }

        $token = $user->createToken('bucoride_auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registration successful.',
            'token' => $token,
            'user' => $user->load(['vehicles', 'driverProfile', 'activeSubscription']),
        ], 201);
    }

    /**
     * Login for Customer, Driver, Admin
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['success' => false, 'message' => 'Invalid credentials.'], 401);
        }

        if (!$user->is_active) {
            return response()->json(['success' => false, 'message' => 'Account is suspended. Contact admin.'], 403);
        }

        // Attach/check device fingerprint
        $deviceHash = $request->header('X-Device-Fingerprint', $request->device_fingerprint);
        if ($deviceHash) {
            DeviceFingerprint::firstOrCreate(
                ['device_hash' => $deviceHash],
                [
                    'user_id' => $user->id,
                    'free_ride_redeemed' => false,
                    'ip_address' => $request->ip(),
                ]
            );
        }

        $token = $user->createToken('bucoride_auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'token' => $token,
            'user' => $user->load(['vehicles', 'driverProfile', 'activeSubscription']),
        ]);
    }

    /**
     * Get Current Authenticated Profile
     */
    public function profile(Request $request)
    {
        $user = $request->user()->load(['vehicles', 'driverProfile', 'activeSubscription', 'subscriptions']);

        // Check customer free ride eligibility
        $deviceHash = $request->header('X-Device-Fingerprint');
        $deviceRedeemed = false;
        if ($deviceHash) {
            $device = DeviceFingerprint::where('device_hash', $deviceHash)->first();
            $deviceRedeemed = $device ? (bool) $device->free_ride_redeemed : false;
        }

        $freeRideEligible = ($user->role === 'customer') && !$user->free_ride_redeemed && !$deviceRedeemed;

        return response()->json([
            'success' => true,
            'user' => $user,
            'free_ride_eligible' => $freeRideEligible,
        ]);
    }

    /**
     * Logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['success' => true, 'message' => 'Logged out successfully.']);
    }
}
