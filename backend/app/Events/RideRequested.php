<?php

namespace App\Events;

use App\Models\Ride;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RideRequested implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $ride;

    public function __construct(Ride $ride)
    {
        $this->ride = $ride->load('customer');
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('drivers-broadcast'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'RideRequested';
    }
}
