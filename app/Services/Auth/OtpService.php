<?php

namespace App\Services\Auth;

use App\Contracts\Auth\OtpServiceInterface;
use App\Enums\OtpChannelEnum;
use App\Events\OtpRequestedEvent;
use App\Exceptions\Auth\OtpException;
use App\Jobs\SendEmailOtpJob;
use App\Jobs\SendOtpJob;
use App\Models\OtpCode;
use App\Models\User;
use App\Repositories\Contracts\OtpCodeRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Contracts\Config\Repository as Config;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class OtpService implements OtpServiceInterface
{
    public function __construct(
        protected Config $config,
        protected OtpCodeRepositoryInterface $otpCodes,
        protected UserRepositoryInterface $users,
    ) {
    }

    public function send(string $target, ?OtpChannelEnum $channel = null): OtpCode
    {
        $target = $this->normalize($target);
        $channel ??= $this->detectChannel($target);

        $this->ensureWithinRateLimit($target);

        $code = $this->config->get('services.otp.test_code')
            ?: $this->generateCode();

        $otp = $this->otpCodes->create(
            target: $target,
            channel: $channel,
            codeHash: Hash::make($code),
            expiresAt: Carbon::now()->addSeconds((int) $this->config->get('services.otp.ttl_seconds', 300)),
        );

        $this->dispatch($target, $channel, $code);

        event(new OtpRequestedEvent($target, $channel));

        return $otp;
    }

    public function sendForLogin(string $target, ?OtpChannelEnum $channel = null): OtpCode
    {
        if (! $this->users->findByMobileOrEmail($this->normalize($target))) {
            throw OtpException::userNotFound();
        }

        return $this->send($target, $channel);
    }

    public function sendForRegistration(string $target, ?OtpChannelEnum $channel = null): OtpCode
    {
        if ($this->users->findByMobileOrEmail($this->normalize($target))) {
            throw OtpException::userAlreadyExists();
        }

        return $this->send($target, $channel);
    }

    public function verify(string $target, string $code): bool
    {
        $target = $this->normalize($target);
        $candidate = $this->otpCodes->findLatestActiveFor($target);

        if (! $candidate || ! Hash::check($code, $candidate->code_hash)) {
            return false;
        }

        $this->otpCodes->markUsed($candidate);

        return true;
    }

    public function verifyOrFail(string $target, string $code): void
    {
        if (! $this->verify($target, $code)) {
            throw OtpException::invalidCode();
        }
    }

    public function verifyAndFindUser(string $target, string $code): ?User
    {
        $this->verifyOrFail($target, $code);

        return $this->users->findByMobileOrEmail($this->normalize($target));
    }

    protected function detectChannel(string $target): OtpChannelEnum
    {
        return Str::contains($target, '@') ? OtpChannelEnum::EMAIL : OtpChannelEnum::SMS;
    }

    protected function normalize(string $target): string
    {
        $target = trim($target);

        return Str::contains($target, '@') ? Str::lower($target) : preg_replace('/\s+/', '', $target);
    }

    protected function generateCode(): string
    {
        $length = max(4, min(8, (int) $this->config->get('services.otp.length', 4)));
        $max = (10 ** $length) - 1;

        return str_pad((string) random_int(0, $max), $length, '0', STR_PAD_LEFT);
    }

    protected function ensureWithinRateLimit(string $target): void
    {
        $limit = (int) $this->config->get('services.otp.rate_limit_per_minute', 3);
        $recentCount = $this->otpCodes->countCreatedSince($target, Carbon::now()->subMinute());

        if ($recentCount >= $limit) {
            throw OtpException::rateLimited();
        }
    }

    protected function dispatch(string $target, OtpChannelEnum $channel, string $code): void
    {
        match ($channel) {
            OtpChannelEnum::EMAIL => SendEmailOtpJob::dispatch($target, $code),
            OtpChannelEnum::SMS => SendOtpJob::dispatch($target, $code),
        };
    }
}
