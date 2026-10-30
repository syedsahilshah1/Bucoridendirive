<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PricingSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'vehicle_type',
        'service_category',
        'base_fare',
        'rate_per_km',
        'rate_per_min',
        'minimum_fare',
    ];

    protected $casts = [
        'base_fare' => 'decimal:2',
        'rate_per_km' => 'decimal:2',
        'rate_per_min' => 'decimal:2',
        'minimum_fare' => 'decimal:2',
    ];
}
