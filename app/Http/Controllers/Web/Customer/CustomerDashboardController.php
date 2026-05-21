<?php

namespace App\Http\Controllers\Web\Customer;

use App\Contracts\Customer\CustomerDashboardServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Resources\Customer\CustomerDashboardResource;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Web counterpart to {@see \App\Http\Controllers\Api\Customer\CustomerDashboardController}.
 * Both controllers delegate to {@see CustomerDashboardServiceInterface} and reuse
 * the same {@see CustomerDashboardResource}; only the response layer differs
 * (Inertia render vs. JSON envelope).
 */
class CustomerDashboardController extends Controller
{
    public function __construct(
        protected CustomerDashboardServiceInterface $dashboard,
    ) {
    }

    public function index(Request $request): Response
    {
        $data = $this->dashboard->build($request->user());

        return Inertia::render('customer/dashboard', [
            'dashboard' => (new CustomerDashboardResource($data))->resolve($request),
        ]);
    }
}
