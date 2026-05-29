<?php

namespace App\Jobs;

use App\Contracts\Sms\SmsGateway;
use App\Exceptions\Sms\SmsDeliveryException;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Dispatches an SMS OTP through the bound {@see SmsGateway}. The gateway today
 * is Twilio in production and a log driver in local dev.
 *
 * Failures are caught, logged, and re-thrown so the queue worker can apply its
 * own retry / backoff policy without losing the failure context.
 */
class SendOtpJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public int $backoff = 30;

    public function __construct(
        public readonly string $mobile,
        public readonly string $code,
    ) {
    }

    public function handle(SmsGateway $sms): void
    {
        try {
            $sms->send($this->mobile, "Your Swiftdrop verification code is {$this->code}.");
        } catch (SmsDeliveryException $e) {
            Log::warning('[otp] sms delivery failed', [
                'mobile' => $this->mobile,
                'error' => $e->getMessage(),
                'attempt' => $this->attempts(),
            ]);

            throw $e;
        }
    }
}
