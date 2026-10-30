<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeviceFingerprint extends Model
{
    use HasFactory;

    protected $fillable = [
        'device_hash',
        'user_id',
        'free_ride_redeemed',
        'redeemed_at',
        'ip_address',
    ];

    protected $casts = [
        'free_ride_redeemed' => 'boolean',
        'redeemed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
