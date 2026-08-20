<?php

namespace App\Http\Controllers\Web\Customer;

use App\Contracts\Customer\OrderTrackingServiceInterface;
use App\Http\Controllers\Controller;
use App\Models\OrderCancellationOption;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Web counterpart of {@see \App\Http\Controllers\Api\Customer\OrderTrackingController}.
 * `show` renders the tracking page with the initial payload; `status` returns
 * the same payload as plain JSON so the page can re-poll every 5s without a
 * full Inertia visit; `cancel` likewise responds JSON so the page updates in
 * place instead of reloading.
 */
class OrderTrackingController extends Controller
{
    public function __construct(
        protected OrderTrackingServiceInterface $tracking,
    ) {
    }

    public function show(string $order): Response
    {
        return Inertia::render('customer/orders/track', [
            'tracking' => $this->tracking->status(Auth::user(), $order),
            'reasons' => OrderCancellationOption::query()->pluck('name')->toArray(),
        ]);
    }

    public function status(string $order): JsonResponse
    {
        return response()->json($this->tracking->status(Auth::user(), $order));
    }

    public function cancel(Request $request, string $order): JsonResponse
    {
        $reason = $request->string('reason')->toString() ?: null;

        return response()->json($this->tracking->cancel(Auth::user(), $order, $reason));
    }
}
