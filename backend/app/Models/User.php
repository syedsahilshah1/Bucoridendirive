<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone_number',
        'password',
        'role',
        'home_town',
        'free_ride_redeemed',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'free_ride_redeemed' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function vehicles()
    {
        return $this->hasMany(Vehicle::class, 'driver_id');
    }

    public function driverProfile()
    {
        return $this->hasOne(DriverProfile::class, 'user_id');
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class, 'driver_id');
    }

    public function activeSubscription()
    {
        return $this->hasOne(Subscription::class, 'driver_id')
            ->where('status', 'active')
            ->where('expiry_date', '>', now())
            ->latest();
    }

    public function customerRides()
    {
        return $this->hasMany(Ride::class, 'customer_id');
    }

    public function driverRides()
    {
        return $this->hasMany(Ride::class, 'driver_id');
    }

    public function customerParcels()
    {
        return $this->hasMany(Parcel::class, 'customer_id');
    }

    public function driverParcels()
    {
        return $this->hasMany(Parcel::class, 'driver_id');
    }
}
