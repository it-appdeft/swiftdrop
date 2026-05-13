<?php

namespace App\Repositories\Eloquent;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;

class UserRepository implements UserRepositoryInterface
{
    public function findByMobileOrEmail(string $target): ?User
    {
        return User::query()
            ->where('mobile', $target)
            ->orWhere('email', $target)
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
