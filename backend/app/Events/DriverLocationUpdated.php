<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DriverLocationUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $driverId;
    public $driverName;
    public $vehicleType;
    public $lat;
    public $lng;
    public $address;

    public function __construct($driverId, $driverName, $vehicleType, $lat, $lng, $address = null)
    {
        $this->driverId = $driverId;
        $this->driverName = $driverName;
        $this->vehicleType = $vehicleType;
        $this->lat = $lat;
        $this->lng = $lng;
        $this->address = $address;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('drivers-live'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'DriverLocationUpdated';
    }
}
