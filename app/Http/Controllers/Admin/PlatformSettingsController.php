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
            ],
        ]);
    }

    public function update(UpdatePlatformSettingsRequest $request): RedirectResponse
    {
        $this->config->setMany($request->validated());

        return back()->with('success', 'Platform settings updated.');
    }
}
