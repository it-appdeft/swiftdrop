<?php

namespace App\Repositories\Contracts;

use App\Models\User;

interface UserRepositoryInterface
{
    public function findByMobileOrEmail(string $target): ?User;

    public function findByMobile(string $mobile): ?User;

    public function findByEmail(string $email): ?User;

    /** Same as {@see findByMobileOrEmail}, but includes soft-deleted users. */
    public function findAnyByMobileOrEmail(string $target): ?User;

    public function upsertByMobileOrEmail(?string $mobile, ?string $email, array $attributes): User;
}
