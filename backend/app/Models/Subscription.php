<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'driver_id',
        'vehicle_type',
        'amount',
        'is_trial',
        'status',
        'start_date',
        'expiry_date',
        'mpesa_reference',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'is_trial' => 'boolean',
        'start_date' => 'datetime',
        'expiry_date' => 'datetime',
    ];

    public function driver()
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    public function isValid(): bool
    {
        return $this->status === 'active' && $this->expiry_date && $this->expiry_date->isFuture();
    }
}
