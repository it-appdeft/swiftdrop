<?php

namespace App\Exceptions\Auth;

use App\Exceptions\ApiException;

/**
 * Centralised OTP error surface. Every failure path through the unified
 * send-otp / verify-otp pipeline funnels through one of these factories so
 * the API contract for these errors stays in lockstep.
 */
class OtpException extends ApiException
{
    public static function rateLimited(): self
    {
        return new self(
            message: 'Too many OTP requests. Please wait a moment before trying again.',
            status: 429,
            field: 'target',
        );
    }

    public static function invalidCode(): self
    {
        return new self(
            message: 'The verification code is invalid.',
            status: 422,
            field: 'code',
        );
    }

    public static function expiredCode(): self
    {
        return new self(
            message: 'The verification code has expired. Please request a new one.',
            status: 422,
            field: 'code',
        );
    }

    public static function maxAttemptsExceeded(): self
    {
        return new self(
            message: 'Maximum verification attempts exceeded. Please request a new code.',
            status: 429,
            field: 'code',
        );
    }

    public static function userNotRegistered(): self
    {
        return new self(
            message: 'No account is registered for this credential. Please sign up first.',
            status: 404,
            field: 'target',
        );
    }

    public static function userAlreadyExists(): self
    {
        return new self(
            message: 'An account is already registered for this credential.',
            status: 409,
            field: 'target',
        );
    }

    public static function userBlocked(): self
    {
        return new self(
            message: 'This account has been suspended. Please contact support.',
            status: 403,
            field: 'target',
        );
    }

    public static function userInactive(): self
    {
        return new self(
            message: 'This account is not active yet. Please complete approval before signing in.',
            status: 403,
            field: 'target',
        );
    }

    public static function roleMismatch(string $expected): self
    {
        return new self(
            message: "This account is not registered as a {$expected}.",
            status: 403,
            field: 'user_type',
        );
    }

    public static function authRequired(): self
    {
        return new self(
            message: 'Authentication is required for this OTP flow.',
            status: 401,
            field: 'type',
        );
    }

    /**
     * The submitted target ("verify current" step) does not match the
     * credential on file for the authenticated user.
     */
    public static function targetNotCurrent(string $field): self
    {
        return new self(
            message: 'The supplied '.$field.' does not match the one on your account.',
            status: 422,
            field: $field,
        );
    }

    /**
     * The credential matches a soft-deleted account. The caller should not
     * receive an OTP — the account first has to be restored or purged by
     * an admin.
     */
    public static function accountDeleted(?string $roleLabel = null): self
    {
        $role = $roleLabel ? trim($roleLabel) : 'this platform';

        return new self(
            message: "Your account as {$role} has been deleted. Please contact the admin to restore your account, or wait for it to be permanently deleted.",
            status: 410,
            field: 'target',
        );
    }
}
