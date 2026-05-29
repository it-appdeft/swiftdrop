<?php

namespace App\Repositories\Eloquent;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class UserRepository implements UserRepositoryInterface
{
    public function findByMobileOrEmail(string $target): ?User
    {
        return $this->buildLookup($target, includeTrashed: false)->first();
    }

    public function findByMobile(string $mobile): ?User
    {
        return $this->mobileLookup(User::query(), $mobile)->first();
    }

    public function findByEmail(string $email): ?User
    {
        return User::query()->where('email', $email)->first();
    }

    /**
     * Same as {@see findByMobileOrEmail}, but includes soft-deleted users
     * so callers (e.g. the OTP eligibility check) can refuse to send a
     * code to a deactivated account.
     */
    public function findAnyByMobileOrEmail(string $target): ?User
    {
        return $this->buildLookup($target, includeTrashed: true)->first();
    }

    public function upsertByMobileOrEmail(?string $mobile, ?string $email, array $attributes): User
    {
        // $mobile is the canonical full E.164 ("+447...") — the table now
        // stores country_code + mobile split apart, so we match against
        // CONCAT() to find any existing row first.
        $match = User::query();

        if ($mobile !== null) {
            $this->mobileLookup($match, $mobile);
        } else {
            $match->where('email', $email);
        }

        $existing = $match->first();
        $filtered = array_filter($attributes, fn ($v) => $v !== null);

        if ($existing) {
            $existing->fill($filtered)->save();

            return $existing;
        }

        return User::create($filtered);
    }

    /**
     * Build a user-lookup query that resolves a single canonical target
     * ("+447789000002" OR "user@example.com") against the split storage.
     */
    protected function buildLookup(string $target, bool $includeTrashed): Builder
    {
        $base = $includeTrashed ? User::withTrashed() : User::query();

        return $base->where(function (Builder $q) use ($target) {
            $this->mobileLookup($q, $target)->orWhere('email', $target);
        });
    }

    /**
     * Match `mobile` against the canonical full E.164 target by gluing
     * country_code + mobile back together at query time. Falls back to a
     * straight `mobile = ?` match so rows whose country_code we couldn't
     * back-fill yet (legacy data) still resolve.
     */
    protected function mobileLookup(Builder $query, string $canonical): Builder
    {
        $candidates = [$canonical];

        // Tolerate legacy rows saved under the pre-fix canonicalizer, which
        // glued the national trunk "0" between the country code and the
        // subscriber number (e.g. "+4407911123002" instead of "+447911123002").
        if (str_starts_with($canonical, '+')) {
            for ($i = 2; $i <= 5; $i++) {
                if ($i < strlen($canonical)) {
                    $candidates[] = substr($canonical, 0, $i).'0'.substr($canonical, $i);
                }
            }
        }

        return $query->where(function (Builder $q) use ($candidates) {
            // New split storage: country_code is non-null, glue at query time.
            $q->whereIn(DB::raw("CONCAT(COALESCE(country_code, ''), mobile)"), $candidates)
                // Legacy rows where country_code wasn't back-filled (mobile
                // still holds the full canonical string).
                ->orWhereIn('mobile', $candidates);
        });
    }
}
