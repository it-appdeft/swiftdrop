<?php

namespace App\Repositories\Eloquent;

use App\Enums\OtpChannelEnum;
use App\Models\OtpCode;
use App\Repositories\Contracts\OtpCodeRepositoryInterface;
use Illuminate\Support\Carbon;

class OtpCodeRepository implements OtpCodeRepositoryInterface
{
    public function create(string $target, OtpChannelEnum $channel, string $codeHash, \DateTimeInterface $expiresAt): OtpCode
    {
        return OtpCode::create([
            'mobile_or_email' => $target,
            'channel' => $channel->value,
            'code_hash' => $codeHash,
            'expires_at' => $expiresAt,
            'used_at' => null,
            'created_at' => Carbon::now(),
        ]);
    }

    public function findLatestActiveFor(string $target): ?OtpCode
    {
        return OtpCode::query()
            ->where('mobile_or_email', $target)
            ->whereNull('used_at')
            ->where('expires_at', '>', Carbon::now())
            ->latest('id')
            ->first();
    }

    public function findLatestFor(string $target): ?OtpCode
    {
        return OtpCode::query()
            ->where('mobile_or_email', $target)
            ->latest('id')
            ->first();
    }

    public function markUsed(OtpCode $otp): void
    {
        $otp->update(['used_at' => Carbon::now()]);
    }

    public function incrementAttempts(OtpCode $otp): void
    {
        $otp->increment('attempts');
    }

    public function countCreatedSince(string $target, \DateTimeInterface $since): int
    {
        return OtpCode::query()
            ->where('mobile_or_email', $target)
            ->where('created_at', '>=', $since)
            ->count();
    }

    public function hasVerifiedFor(string $target): bool
    {
        return OtpCode::query()
            ->where('mobile_or_email', $target)
            ->whereNotNull('used_at')
            ->exists();
    }
}
