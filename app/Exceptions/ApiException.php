<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use RuntimeException;
use Throwable;

/**
 * Base class for domain exceptions that should render to the common
 * API envelope ({success,message,errors}) without controllers needing
 * any try/catch boilerplate.
 */
class ApiException extends RuntimeException
{
    /** HTTP status to use when rendering. */
    public int $status = 422;

    /** Field key this error should attach to in the errors bag. */
    public string $field = 'error';

    public function __construct(
        string $message = '',
        int $status = 422,
        string $field = 'error',
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, 0, $previous);
        $this->status = $status;
        $this->field = $field;
    }

    public function render(Request $request): JsonResponse|RedirectResponse
    {
        // API routes (and any request without a session to redirect back to)
        // always get the JSON envelope. A stateless client that omits the
        // Accept: application/json header would otherwise fall through to
        // back(), which needs a session and 302-redirects instead of
        // returning the error (e.g. PUT /api/customer/addresses/{bad-id}).
        if ($request->expectsJson() || $request->is('api/*') || ! $request->hasSession()) {
            return response()->json([
                'success' => false,
                'message' => $this->getMessage(),
                'errors' => (object) [$this->field => [$this->getMessage()]],
            ], $this->status);
        }

        return back()->withErrors([$this->field => $this->getMessage()])->withInput();
    }
}
