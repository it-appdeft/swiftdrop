<?php

namespace App\Traits;

use App\Models\User;

trait IssuesTokens
{
    protected function issueToken(User $user): ?string
    {
        if (! method_exists($user, 'createToken')) {
            return null;
        }

        return $user->createToken('mobile-app')->plainTextToken;
    }
}
