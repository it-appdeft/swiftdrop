<?php

namespace App\Services\Profile;

use App\Contracts\Auth\OtpServiceInterface;
use App\Enums\OtpChannelEnum;
use App\Exceptions\Auth\OtpException;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Services\Files\ImageUploadService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Shared profile operations used by both customer and driver flows:
 * - phone change with OTP
 * - email change with OTP
 * - name parsing helpers
 *
 * Concrete services extend this and add their own profile-specific
 * update / address / document logic.
 */
abstract class BaseProfileService
{
    public function __construct(
        protected OtpServiceInterface $otp,
        protected UserRepositoryInterface $users,
        protected ImageUploadService $imageUpload,
    ) {
    }

    public function initiatePhoneChange(User $user, string $newPhone, string $countryCode): void
    {
        $canonicalPhone = $this->canonicalPhone($newPhone, $countryCode);

        $existingUser = $this->users->findByMobile($canonicalPhone);
        if ($existingUser && $existingUser->id !== $user->id) {
            throw OtpException::invalidCode();
        }

        $this->otp->send($canonicalPhone, OtpChannelEnum::SMS);
    }

    public function initiateEmailChange(User $user, string $newEmail): void
    {
        $canonicalEmail = Str::lower(trim($newEmail));

        $existingUser = $this->users->findByEmail($canonicalEmail);
        if ($existingUser && $existingUser->id !== $user->id) {
            throw OtpException::invalidCode();
        }

        $this->otp->send($canonicalEmail, OtpChannelEnum::EMAIL);
    }

    public function completePhoneChange(User $user, string $newPhone, string $code): User
    {
        return DB::transaction(function () use ($user, $newPhone, $code) {
            $canonicalPhone = $this->canonicalPhone($newPhone, '');

            $this->otp->verifyOrFail($canonicalPhone, $code);

            $user->update(['mobile' => $canonicalPhone]);

            return $user->fresh()->loadProfileRelation();
        });
    }

    public function completeEmailChange(User $user, string $newEmail, string $code): User
    {
        return DB::transaction(function () use ($user, $newEmail, $code) {
            $canonicalEmail = Str::lower(trim($newEmail));

            $this->otp->verifyOrFail($canonicalEmail, $code);

            $user->update(['email' => $canonicalEmail]);

            return $user->fresh()->loadProfileRelation();
        });
    }

    protected function canonicalPhone(string $phone, string $countryCode): string
    {
        $phone = preg_replace('/\s+/', '', $phone);

        if (Str::startsWith($phone, '+')) {
            return $phone;
        }

        return $countryCode.$phone;
    }

    protected function firstName(string $name): string
    {
        return Str::before(trim($name), ' ') ?: $name;
    }

    protected function lastName(string $name): string
    {
        $rest = Str::after(trim($name), ' ');

        return $rest === $name ? '' : trim($rest);
    }
}
