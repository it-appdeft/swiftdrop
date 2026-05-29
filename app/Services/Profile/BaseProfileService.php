<?php

namespace App\Services\Profile;

use App\Services\Files\ImageUploadService;
use Illuminate\Support\Str;

/**
 * Shared helpers used by both customer and driver profile services. Phone /
 * email change is handled by the unified OTP flow (see App\Services\Auth\OtpFlowService)
 * so it no longer lives here.
 */
abstract class BaseProfileService
{
    public function __construct(
        protected ImageUploadService $imageUpload,
    ) {
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
