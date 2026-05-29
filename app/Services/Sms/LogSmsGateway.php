<?php

namespace App\Services\Sms;

use App\Contracts\Sms\SmsGateway;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class LogSmsGateway implements SmsGateway
{
    public function send(string $to, string $message): string
    {
        $sid = 'log_'.Str::random(16);

        Log::info('[sms] outgoing', [
            'to' => $to,
            'message' => $message,
            'sid' => $sid,
        ]);

        return $sid;
    }
}
