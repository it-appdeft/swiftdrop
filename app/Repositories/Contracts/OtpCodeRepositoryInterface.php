<?php

namespace App\Repositories\Contracts;

use App\Enums\OtpChannelEnum;
use App\Models\OtpCode;

interface OtpCodeRepositoryInterface
{
    public function create(string $target, OtpChannelEnum $channel, string $codeHash, \DateTimeInterface $expiresAt): OtpCode;

    public function findLatestActiveFor(string $target): ?OtpCode;

    public function markUsed(OtpCode $otp): void;

    public function countCreatedSince(string $target, \DateTimeInterface $since): int;

    /** Has the given target ever successfully completed an OTP verification? */
    public function hasVerifiedFor(string $target): bool;
}
