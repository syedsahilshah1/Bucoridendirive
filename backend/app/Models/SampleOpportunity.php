<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SampleOpportunity extends Model
{
    use HasFactory;

    protected $fillable = [
        'driver_id',
        'pickup_address',
        'destination_address',
        'distance_km',
        'estimated_fare',
        'status',
    ];

    protected $casts = [
        'distance_km' => 'decimal:2',
        'estimated_fare' => 'decimal:2',
    ];

    public function driver()
    {
        return $this->belongsTo(User::class, 'driver_id');
    }
}
