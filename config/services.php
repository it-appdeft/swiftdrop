<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'sms' => [
        // Active gateway driver: "twilio" or "log".
        'default' => env('SMS_DRIVER', 'log'),
    ],

    'twilio' => [
        'sid' => env('TWILIO_ACCOUNT_SID'),
        'token' => env('TWILIO_AUTH_TOKEN'),
        'from' => env('TWILIO_FROM'),
        'messaging_service_sid' => env('TWILIO_MESSAGING_SERVICE_SID'),
    ],

    'otp' => [
        'length' => (int) env('OTP_LENGTH', 4),
        'ttl_seconds' => (int) env('OTP_TTL_SECONDS', 300),
        'rate_limit_per_minute' => (int) env('OTP_RATE_LIMIT_PER_MINUTE', 3),
        // Maximum wrong-code attempts allowed per issued OTP before the user
        // must request a new code. 0 disables the cap.
        'max_attempts' => (int) env('OTP_MAX_ATTEMPTS', 5),
        // Set in local/staging to bypass random codes (e.g. "1231") for manual QA.
        // Leave unset (null) in production so codes are always random.
        'test_code' => env('OTP_TEST_CODE'),
    ],

];
