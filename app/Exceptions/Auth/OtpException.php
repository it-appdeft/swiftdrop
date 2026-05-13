<?php

namespace App\Exceptions\Auth;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use RuntimeException;

class OtpException extends RuntimeException
{
    /** HTTP status to use when rendering. */
    public int $status = 422;

    /** Form field this error should attach to in web (Inertia) responses. */
    public string $field = 'code';

    public static function rateLimited(): self
    {
        $e = new self('Too many OTP requests. Please wait a moment before trying again.');
        $e->status = 429;
        $e->field = 'target';

        return $e;
    }

    public static function invalidCode(): self
    {
        return new self('The verification code is invalid or has expired.');
    }

    /**
     * Render the exception. JSON for API clients (standard {success,message,errors} envelope),
     * back-with-errors for Inertia/web. Lets controllers skip try/catch boilerplate.
     */
    public function render(Request $request): JsonResponse|RedirectResponse
    {
        if ($request->expectsJson()) {
            return response()->json([
                'success' => false,
                'message' => $this->getMessage(),
                'errors' => (object) [$this->field => [$this->getMessage()]],
            ], $this->status);
        }

        return back()->withErrors([$this->field => $this->getMessage()])->withInput();
    }
}
