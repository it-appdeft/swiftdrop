<?php

namespace App\Services\Sms;

use App\Contracts\Sms\SmsGateway;
use App\Exceptions\Sms\SmsDeliveryException;
use Throwable;
use Twilio\Exceptions\TwilioException;
use Twilio\Rest\Client;

class TwilioSmsGateway implements SmsGateway
{
    public function __construct(
        private readonly string $accountSid,
        private readonly string $authToken,
        private readonly string $from,
        private readonly ?string $messagingServiceSid = null,
    ) {
    }

    public function send(string $to, string $message): string
    {
        try {
            $client = new Client($this->accountSid, $this->authToken);

            $payload = ['body' => $message];

            if ($this->messagingServiceSid) {
                $payload['messagingServiceSid'] = $this->messagingServiceSid;
            } else {
                $payload['from'] = $this->from;
            }

            $created = $client->messages->create($to, $payload);

            return $created->sid;
        } catch (TwilioException $e) {
            throw new SmsDeliveryException("Twilio rejected SMS to {$to}: {$e->getMessage()}", previous: $e);
        } catch (Throwable $e) {
            throw new SmsDeliveryException("Failed to send SMS to {$to}: {$e->getMessage()}", previous: $e);
        }
    }
}
