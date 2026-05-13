<?php

namespace App\Http\Requests\Auth\Concerns;

use Illuminate\Support\Str;

/**
 * Canonicalisation helpers shared by every auth request that accepts a target
 * identifier (email OR country_code + mobile). Keeping the rules in one place
 * means the OTP send / verify / register endpoints all key on the same string.
 */
trait CanonicalizesTarget
{
    public function canonicalEmail(): string
    {
        $email = (string) $this->input('email');

        return $email === '' ? '' : Str::lower(trim($email));
    }

    public function canonicalMobile(): string
    {
        $mobile = preg_replace('/\s+/', '', (string) $this->input('mobile'));

        if ($mobile === '') {
            return '';
        }

        if (Str::startsWith($mobile, '+')) {
            return $mobile;
        }

        return ((string) $this->input('country_code', '')).$mobile;
    }

    /**
     * Single canonical identifier — prefers email when present, else mobile.
     * Used by send-otp / verify-otp where exactly one of the two is filled.
     */
    public function canonicalTarget(): string
    {
        return $this->canonicalEmail() !== '' ? $this->canonicalEmail() : $this->canonicalMobile();
    }
}
