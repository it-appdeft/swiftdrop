<?php

namespace App\Events;

use App\Enums\OtpChannelEnum;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fires whenever an OTP is generated and queued for delivery.
 * Listeners are free to log, audit, push to analytics, alert on bursts, etc.
 */
class OtpRequestedEvent
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly string $target,
        public readonly OtpChannelEnum $channel,
        public readonly string $purpose = 'login',
    ) {
    }
}
