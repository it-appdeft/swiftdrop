<?php

namespace App\Services\Auth;

use App\Contracts\Auth\OtpServiceInterface;
use App\Contracts\Sms\SmsGateway;
use App\Enums\OtpChannelEnum;
use App\Exceptions\Auth\OtpException;
use App\Models\OtpCode;
use App\Models\User;
use App\Repositories\Contracts\OtpCodeRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Contracts\Config\Repository as Config;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class OtpService implements OtpServiceInterface
{
    public function __construct(
        protected SmsGateway $sms,
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

        $code = $this->generateCode();

        $otp = $this->otpCodes->create(
            target: $target,
            channel: $channel,
            codeHash: Hash::make($code),
            expiresAt: Carbon::now()->addSeconds((int) $this->config->get('services.otp.ttl_seconds', 300)),
        );

        $this->deliver($target, $channel, $code);

        return $otp;
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

    protected function deliver(string $target, OtpChannelEnum $channel, string $code): void
    {
        $message = "Your Swiftdrop verification code is {$code}.";

        if ($channel === OtpChannelEnum::EMAIL) {
            Mail::raw($message, function ($mail) use ($target) {
                $mail->to($target)->subject('Your Swiftdrop verification code');
            });

            return;
        }

        $this->sms->send($target, $message);
    }
}
