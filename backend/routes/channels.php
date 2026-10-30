<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Broadcast to active online drivers
Broadcast::channel('drivers-broadcast', function () {
    return true;
});

// Live GPS locations channel
Broadcast::channel('drivers-live', function () {
    return true;
});

// Individual driver alert channel
Broadcast::channel('driver.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id || $user->role === 'admin';
});

// Ride negotiation and live coordinate tracking channel
Broadcast::channel('ride.{id}', function () {
    return true;
});

// Public parcel tracking link channel
Broadcast::channel('parcel.{token}', function () {
    return true;
});
