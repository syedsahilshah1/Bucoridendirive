<?php

namespace App\Events;

use App\Models\Parcel;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ParcelStatusUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $parcel;
    public $currentLat;
    public $currentLng;

    public function __construct(Parcel $parcel, $currentLat = null, $currentLng = null)
    {
        $this->parcel = $parcel->load(['customer', 'driver.vehicles']);
        $this->currentLat = $currentLat;
        $this->currentLng = $currentLng;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('parcel.' . $this->parcel->tracking_token),
            new Channel('drivers-broadcast'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'ParcelStatusUpdated';
    }
}
