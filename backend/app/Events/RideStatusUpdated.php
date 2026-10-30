<?php

namespace App\Events;

use App\Models\Ride;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RideStatusUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $ride;

    public function __construct(Ride $ride)
    {
        $this->ride = $ride->load(['customer', 'driver.vehicles']);
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('ride.' . $this->ride->id),
            new Channel('drivers-broadcast'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'RideStatusUpdated';
    }
}
