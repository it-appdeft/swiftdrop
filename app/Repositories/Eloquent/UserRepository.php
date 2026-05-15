<?php

namespace App\Repositories\Eloquent;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;

class UserRepository implements UserRepositoryInterface
{
    public function findByMobileOrEmail(string $target): ?User
    {
        $candidates = [$target];

        // Tolerate legacy rows saved under the pre-fix canonicalizer, which
        // glued the national trunk "0" between the country code and the
        // subscriber number (e.g. "+4407911123002" instead of "+447911123002").
        // We don't know the exact country-code length, so try each plausible
        // split position (country codes are 1–4 digits per E.164).
        if (str_starts_with($target, '+')) {
            for ($i = 2; $i <= 5; $i++) {
                if ($i < strlen($target)) {
                    $candidates[] = substr($target, 0, $i).'0'.substr($target, $i);
                }
            }
        }

        return User::query()
            ->where(function ($q) use ($candidates) {
                $q->whereIn('mobile', $candidates)->orWhereIn('email', $candidates);
            })
            ->first();
    }

    public function findByMobile(string $mobile): ?User
    {
        return User::query()->where('mobile', $mobile)->first();
    }

    public function findByEmail(string $email): ?User
    {
        return User::query()->where('email', $email)->first();
    }

    public function upsertByMobileOrEmail(?string $mobile, ?string $email, array $attributes): User
    {
        $matchKey = $mobile !== null
            ? ['mobile' => $mobile]
            : ['email' => $email];

        return User::updateOrCreate($matchKey, array_filter($attributes, fn ($v) => $v !== null));
    }
}
