<?php

namespace App\Listeners;

use App\Events\OtpRequestedEvent;
use Illuminate\Support\Facades\Log;

class LogOtpRequestListener
{
    public function handle(OtpRequestedEvent $event): void
    {
        Log::info('[otp] requested', [
            'target' => $event->target,
            'channel' => $event->channel->value,
            'purpose' => $event->purpose,
        ]);
    }
}
