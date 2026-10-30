<?php

namespace App\Events;

use App\Models\SampleOpportunity;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SampleOpportunityDispatched implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $opportunity;
    public $driverId;

    public function __construct(SampleOpportunity $opportunity)
    {
        $this->opportunity = $opportunity;
        $this->driverId = $opportunity->driver_id;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('driver.' . $this->driverId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'SampleOpportunityDispatched';
    }
}
