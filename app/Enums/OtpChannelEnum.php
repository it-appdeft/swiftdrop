<?php

namespace App\Enums;

enum OtpChannelEnum: string
{
    case SMS = 'sms';
    case EMAIL = 'email';
}
