<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Parcel extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'driver_id',
        'sender_name',
        'sender_phone',
        'receiver_name',
        'receiver_phone',
        'parcel_description',
        'pickup_address',
        'pickup_lat',
        'pickup_lng',
        'delivery_address',
        'delivery_lat',
        'delivery_lng',
        'distance_km',
        'estimated_fare',
        'tracking_token',
        'status',
    ];

    protected $casts = [
        'pickup_lat' => 'float',
        'pickup_lng' => 'float',
        'delivery_lat' => 'float',
        'delivery_lng' => 'float',
        'distance_km' => 'decimal:2',
        'estimated_fare' => 'decimal:2',
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
