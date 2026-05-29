<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Delivers an OTP via email. Swap the {@see Mail::raw()} call for a Mailable
 * (e.g. OtpVerificationMail) when the design team supplies an email template.
 */
class SendEmailOtpJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public int $backoff = 30;

    public function __construct(
        public readonly string $email,
        public readonly string $code,
    ) {
    }

    public function handle(): void
    {
        try {
            Mail::raw(
                "Your Swiftdrop verification code is {$this->code}.",
                function ($mail) {
                    $mail->to($this->email)->subject('Your Swiftdrop verification code');
                },
            );
        } catch (Throwable $e) {
            Log::warning('[otp] email delivery failed', [
                'email' => $this->email,
                'error' => $e->getMessage(),
                'attempt' => $this->attempts(),
            ]);

            throw $e;
        }
    }
}
