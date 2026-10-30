<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DriverProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'is_online',
        'current_lat',
        'current_lng',
        'current_address',
        'sample_opportunities_count',
        'missed_opportunities_count',
        'sample_potential_earnings',
        'last_seen_at',
    ];

    protected $casts = [
        'is_online' => 'boolean',
        'current_lat' => 'float',
        'current_lng' => 'float',
        'sample_potential_earnings' => 'decimal:2',
        'last_seen_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
