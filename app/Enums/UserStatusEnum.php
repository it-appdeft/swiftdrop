<?php

namespace App\Enums;

enum UserStatusEnum: string
{
    case ACTIVE = 'active';
    case PENDING_APPROVAL = 'pending_approval';
    case SUSPENDED = 'suspended';
}
