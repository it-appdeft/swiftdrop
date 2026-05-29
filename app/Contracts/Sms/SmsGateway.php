<?php

namespace App\Contracts\Sms;

interface SmsGateway
{
    /**
     * Deliver a single SMS message.
     *
     * @param  string  $to       E.164 mobile number, e.g. "+447700900000".
     * @param  string  $message  UTF-8 message body.
     * @return string            Provider-side message identifier.
     */
    public function send(string $to, string $message): string;
}
