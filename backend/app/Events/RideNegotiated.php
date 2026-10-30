<?php

namespace App\Events;

use App\Models\Ride;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RideNegotiated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $ride;
    public $message;

    public function __construct(Ride $ride, string $message = '')
    {
        $this->ride = $ride->load(['customer', 'driver']);
        $this->message = $message;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('ride.' . $this->ride->id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'RideNegotiated';
    }
}
