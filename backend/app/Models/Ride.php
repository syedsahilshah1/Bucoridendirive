<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ride extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'driver_id',
        'vehicle_type',
        'service_category',
        'pickup_address',
        'pickup_lat',
        'pickup_lng',
        'destination_address',
        'destination_lat',
        'destination_lng',
        'distance_km',
        'duration_min',
        'estimated_fare',
        'agreed_fare',
        'proposed_fare',
        'counter_fare',
        'counter_by',
        'free_ride_subsidy',
        'customer_payable_fare',
        'status',
        'payment_status',
        'completed_at',
    ];

    protected $casts = [
        'pickup_lat' => 'float',
        'pickup_lng' => 'float',
        'destination_lat' => 'float',
        'destination_lng' => 'float',
        'distance_km' => 'decimal:2',
        'estimated_fare' => 'decimal:2',
        'agreed_fare' => 'decimal:2',
        'proposed_fare' => 'decimal:2',
        'counter_fare' => 'decimal:2',
        'free_ride_subsidy' => 'decimal:2',
        'customer_payable_fare' => 'decimal:2',
        'completed_at' => 'datetime',
    ];

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function driver()
    {
        return $this->belongsTo(User::class, 'driver_id');
    }
}
