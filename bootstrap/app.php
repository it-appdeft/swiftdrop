<?php

use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
        $middleware->alias([
            'admin' => \App\Http\Middleware\EnsureIsAdmin::class,
            'customer' => \App\Http\Middleware\EnsureIsCustomer::class,
            'restaurant' => \App\Http\Middleware\EnsureIsRestaurant::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Centralize JSON error responses so every API client receives the
        // same {success,message,errors} envelope. Domain exceptions that
        // extend App\Exceptions\ApiException render themselves and bypass
        // this callback; framework-level exceptions fall through here.
        $exceptions->render(function (Throwable $e, Request $request) {
            if (! $request->expectsJson()) {
                return null;
            }

            return match (true) {
                $e instanceof ValidationException => response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                    'errors' => (object) $e->errors(),
                ], $e->status),

                $e instanceof AuthenticationException => response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated.',
                    'errors' => (object) [],
                ], 401),

                $e instanceof AuthorizationException => response()->json([
                    'success' => false,
                    'message' => $e->getMessage() ?: 'This action is unauthorized.',
                    'errors' => (object) [],
                ], 403),

                $e instanceof ModelNotFoundException => response()->json([
                    'success' => false,
                    'message' => 'Resource not found.',
                    'errors' => (object) [],
                ], 404),

                $e instanceof NotFoundHttpException => response()->json([
                    'success' => false,
                    'message' => $e->getMessage() ?: 'Resource not found.',
                    'errors' => (object) [],
                ], 404),

                $e instanceof MethodNotAllowedHttpException => response()->json([
                    'success' => false,
                    'message' => 'Method not allowed.',
                    'errors' => (object) [],
                ], 405),

                $e instanceof ThrottleRequestsException => response()->json([
                    'success' => false,
                    'message' => 'Too many requests. Please try again later.',
                    'errors' => (object) [],
                ], 429),

                $e instanceof HttpExceptionInterface => response()->json([
                    'success' => false,
                    'message' => $e->getMessage() ?: 'Request failed.',
                    'errors' => (object) [],
                ], $e->getStatusCode()),

                default => response()->json([
                    'success' => false,
                    'message' => config('app.debug') ? $e->getMessage() : 'Server error. Please try again later.',
                    'errors' => (object) [],
                ], 500),
            };
        });
    })->create();
