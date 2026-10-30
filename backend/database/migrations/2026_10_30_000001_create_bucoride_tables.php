<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Modify users table with BUCORIDE profile fields
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone_number')->nullable()->unique()->after('email');
            $table->enum('role', ['customer', 'driver', 'admin'])->default('customer')->after('password');
            $table->string('home_town')->nullable()->after('role');
            $table->boolean('free_ride_redeemed')->default(false)->after('home_town');
            $table->boolean('is_active')->default(true)->after('free_ride_redeemed');
        });

        // 2. Anti-Abuse Device Fingerprints
        Schema::create('device_fingerprints', function (Blueprint $table) {
            $table->id();
            $table->string('device_hash')->unique();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('free_ride_redeemed')->default(false);
            $table->timestamp('redeemed_at')->nullable();
            $table->string('ip_address')->nullable();
            $table->timestamps();
        });

        // 3. Vehicles Table
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('driver_id')->constrained('users')->cascadeOnDelete();
            $table->enum('vehicle_type', ['car', 'motorcycle']);
            $table->enum('service_category', ['private_hire', 'psv']);
            $table->string('make_model');
            $table->string('plate_number')->unique();
            $table->boolean('is_verified')->default(true);
            $table->timestamps();
        });

        // 4. Driver Profiles & Live Location
        Schema::create('driver_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->boolean('is_online')->default(false);
            $table->double('current_lat', 10, 7)->nullable();
            $table->double('current_lng', 10, 7)->nullable();
            $table->string('current_address')->nullable();
            $table->unsignedInteger('sample_opportunities_count')->default(0);
            $table->unsignedInteger('missed_opportunities_count')->default(0);
            $table->decimal('sample_potential_earnings', 10, 2)->default(0.00);
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();
        });

        // 5. Driver Subscriptions
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('driver_id')->constrained('users')->cascadeOnDelete();
            $table->enum('vehicle_type', ['car', 'motorcycle']);
            $table->decimal('amount', 10, 2)->default(0.00);
            $table->boolean('is_trial')->default(false);
            $table->enum('status', ['active', 'expired', 'pending'])->default('pending');
            $table->timestamp('start_date')->nullable();
            $table->timestamp('expiry_date')->nullable();
            $table->string('mpesa_reference')->nullable();
            $table->timestamps();
        });

        // 6. Pricing Configurations
        Schema::create('pricing_settings', function (Blueprint $table) {
            $table->id();
            $table->enum('vehicle_type', ['motorcycle', 'car'])->unique();
            $table->string('service_category')->default('all');
            $table->decimal('base_fare', 8, 2);
            $table->decimal('rate_per_km', 8, 2);
            $table->decimal('rate_per_min', 8, 2);
            $table->decimal('minimum_fare', 8, 2);
            $table->timestamps();
        });

        // 7. Rides & Fare Negotiation
        Schema::create('rides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('driver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('vehicle_type', ['motorcycle', 'car']);
            $table->string('service_category')->nullable();
            $table->text('pickup_address');
            $table->double('pickup_lat', 10, 7);
            $table->double('pickup_lng', 10, 7);
            $table->text('destination_address');
            $table->double('destination_lat', 10, 7);
            $table->double('destination_lng', 10, 7);
            $table->decimal('distance_km', 8, 2);
            $table->integer('duration_min');
            $table->decimal('estimated_fare', 10, 2);
            $table->decimal('agreed_fare', 10, 2)->nullable();
            $table->decimal('proposed_fare', 10, 2)->nullable();
            $table->decimal('counter_fare', 10, 2)->nullable();
            $table->enum('counter_by', ['customer', 'driver'])->nullable();
            $table->decimal('free_ride_subsidy', 10, 2)->default(0.00);
            $table->decimal('customer_payable_fare', 10, 2)->default(0.00);
            $table->enum('status', ['requested', 'negotiating', 'accepted', 'arrived', 'in_progress', 'completed', 'cancelled'])->default('requested');
            $table->string('payment_status')->default('pending');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        // 8. Parcel Deliveries
        Schema::create('parcels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('driver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('sender_name');
            $table->string('sender_phone');
            $table->string('receiver_name');
            $table->string('receiver_phone');
            $table->text('parcel_description');
            $table->text('pickup_address');
            $table->double('pickup_lat', 10, 7);
            $table->double('pickup_lng', 10, 7);
            $table->text('delivery_address');
            $table->double('delivery_lat', 10, 7);
            $table->double('delivery_lng', 10, 7);
            $table->decimal('distance_km', 8, 2);
            $table->decimal('estimated_fare', 10, 2);
            $table->string('tracking_token', 64)->unique();
            $table->enum('status', ['pending', 'accepted', 'collected', 'in_transit', 'delivered', 'cancelled'])->default('pending');
            $table->timestamps();
        });

        // 9. Sample Ride Opportunities
        Schema::create('sample_opportunities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('driver_id')->constrained('users')->cascadeOnDelete();
            $table->text('pickup_address');
            $table->text('destination_address');
            $table->decimal('distance_km', 8, 2);
            $table->decimal('estimated_fare', 10, 2);
            $table->enum('status', ['generated', 'viewed', 'missed'])->default('generated');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sample_opportunities');
        Schema::dropIfExists('parcels');
        Schema::dropIfExists('rides');
        Schema::dropIfExists('pricing_settings');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('driver_profiles');
        Schema::dropIfExists('vehicles');
        Schema::dropIfExists('device_fingerprints');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone_number', 'role', 'home_town', 'free_ride_redeemed', 'is_active']);
        });
    }
};
