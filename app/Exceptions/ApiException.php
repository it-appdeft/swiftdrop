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
