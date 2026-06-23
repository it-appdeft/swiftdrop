<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdatePlatformSettingsRequest;
use App\Services\Platform\PlatformConfigService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PlatformSettingsController extends Controller
{
    public function __construct(
        protected PlatformConfigService $config,
    ) {
    }

    public function edit(): Response
    {
        return Inertia::render('admin/platform-settings/edit', [
            'settings' => [
                'customer_dashboard_radius_miles' => $this->config->float(
                    PlatformConfigService::KEY_DASHBOARD_RADIUS_MILES,
                    5.0,
                ),
                'customer_dashboard_fallback_limit' => $this->config->int(
                    PlatformConfigService::KEY_DASHBOARD_FALLBACK_LIMIT,
                    12,
                ),
                'base_delivery_fee_gbp' => $this->config->float(PlatformConfigService::KEY_BASE_DELIVERY_FEE, 1.99),
                'delivery_fee_per_mile_gbp' => $this->config->float(PlatformConfigService::KEY_DELIVERY_FEE_PER_MILE, 0.80),
                'free_delivery_threshold_gbp' => $this->config->float(PlatformConfigService::KEY_FREE_DELIVERY_THRESHOLD, 25.0),
                'order_tax_rate_percent' => $this->config->float(PlatformConfigService::KEY_ORDER_TAX_RATE, 5.0),
                'delivery_request_timeout_seconds' => $this->config->int(PlatformConfigService::KEY_DELIVERY_REQUEST_TIMEOUT_SECONDS, 30),
                // Legal copy — raw text; blank lines separate paragraphs.
                'privacy_policy' => $this->config->get(PlatformConfigService::KEY_PRIVACY_POLICY, ''),
                'terms_and_conditions' => $this->config->get(PlatformConfigService::KEY_TERMS_AND_CONDITIONS, ''),
            ],
        ]);
    }

    public function update(UpdatePlatformSettingsRequest $request): RedirectResponse
    {
        $this->config->setMany($request->validated());

        // No flash message: the page surfaces its own success toast client-side
        // (onSuccess) without a reload, so a flash would double-toast.
        return back();
    }
}
