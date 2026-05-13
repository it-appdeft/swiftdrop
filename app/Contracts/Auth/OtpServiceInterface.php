<?php

namespace App\Contracts\Auth;

use App\Enums\OtpChannelEnum;
use App\Models\OtpCode;
use App\Models\User;

interface OtpServiceInterface
{
    public function send(string $target, ?OtpChannelEnum $channel = null): OtpCode;

    public function verify(string $target, string $code): bool;

    public function verifyOrFail(string $target, string $code): void;

    public function verifyAndFindUser(string $target, string $code): ?User;
}
