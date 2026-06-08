<?php

namespace App\Services\Driver;

use App\Contracts\Driver\DriverDashboardServiceInterface;
use App\Exceptions\InvalidInputException;
use App\Exceptions\ResourceNotFoundException;
use App\Models\Delivery;
use App\Models\DriverEarning;
use App\Models\DriverProfile;
use App\Models\User;
use App\Services\Platform\PlatformConfigService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DriverDashboardService implements DriverDashboardServiceInterface
{
    public function __construct(
        protected PlatformConfigService $config,
    ) {
    }

    public function dashboard(User $user): array
    {
        $profile = $this->profileOrFail($user);
        $today = Carbon::today();

        $earningsToday = (float) $profile->earnings()
            ->whereDate('earned_at', $today)
            ->sum('amount');

        $deliveriesToday = $profile->deliveries()
            ->where('status', 'delivered')
            ->whereDate('delivered_at', $today)
            ->count();

        return [
            'availability' => $profile->availability,
            'is_online' => $profile->availability === 'online',
            'approval_status' => $profile->approval_status,
            'is_setup_complete' => $profile->isSetupComplete(),
            'current_location' => [
                'lat' => $profile->current_lat !== null ? (float) $profile->current_lat : null,
                'lng' => $profile->current_lng !== null ? (float) $profile->current_lng : null,
            ],
            'earnings' => [
                'today' => round($earningsToday, 2),
                'currency' => 'GBP',
            ],
            'deliveries_today' => $deliveriesToday,
            'time_online_minutes' => $this->minutesOnline($profile),
            // Admin-tunable countdown the request card shows before the offer
            // rolls to the next driver.
            'delivery_request_timeout_seconds' => $this->config->int(
                PlatformConfigService::KEY_DELIVERY_REQUEST_TIMEOUT_SECONDS,
                30,
            ),
        ];
    }

    public function pendingDeliveries(User $user): Collection
    {
        $profile = $this->profileOrFail($user);

        // Mirror the home screen: offers are only surfaced to an approved driver
        // who is online. Otherwise there's nothing to show ("go online…").
        if (! $profile->isApproved() || $profile->availability !== 'online') {
            return collect();
        }

        return Delivery::query()
            ->where('status', 'pending_assignment')
            ->whereNull('driver_id')
            ->with(['order.restaurant.uploads', 'order.address'])
            ->latest('id')
            ->get();
    }

    public function setAvailability(User $user, string $availability): DriverProfile
    {
        $profile = $this->profileOrFail($user);

        if ($availability === 'online') {
            if (! $profile->isApproved()) {
                throw InvalidInputException::make(
                    'Your account is not approved to receive deliveries yet.',
                    'availability',
                );
            }
            if (! $profile->isSetupComplete()) {
                throw InvalidInputException::make(
                    'Finish setting up your profile before going online.',
                    'availability',
                );
            }
        }

        // Stamp the start of the online session so the dashboard can report
        // "Time Online"; clear it when going offline.
        $profile->forceFill([
            'availability' => $availability,
            'online_since' => $availability === 'online'
                ? ($profile->availability === 'online' ? $profile->online_since : Carbon::now())
                : null,
        ])->save();

        return $profile;
    }

    public function updateLocation(User $user, float $lat, float $lng): DriverProfile
    {
        $profile = $this->profileOrFail($user);

        $profile->forceFill([
            'current_lat' => $lat,
            'current_lng' => $lng,
        ])->save();

        return $profile;
    }

    public function respondToDelivery(User $user, int $deliveryId, string $action): Delivery
    {
        $profile = $this->profileOrFail($user);

        if (! $profile->isApproved()) {
            throw InvalidInputException::make('Your account is not approved to take deliveries.', 'action');
        }

        return DB::transaction(function () use ($profile, $deliveryId, $action) {
            /** @var Delivery|null $delivery */
            $delivery = Delivery::query()->lockForUpdate()->find($deliveryId);

            if (! $delivery) {
                throw ResourceNotFoundException::for('Delivery', 'delivery');
            }

            return $action === 'accept'
                ? $this->acceptDelivery($profile, $delivery)
                : $this->rejectDelivery($profile, $delivery);
        });
    }

    // ─── Internals ──────────────────────────────────────────────────────────

    private function acceptDelivery(DriverProfile $profile, Delivery $delivery): Delivery
    {
        // Already mine → idempotent success. Taken by someone else → conflict.
        if ($delivery->driver_id === $profile->id && $delivery->status === 'assigned') {
            return $delivery;
        }
        if ($delivery->status !== 'pending_assignment' || $delivery->driver_id !== null) {
            throw InvalidInputException::make('This delivery is no longer available.', 'delivery');
        }

        $delivery->forceFill([
            'driver_id' => $profile->id,
            'status' => 'assigned',
            'assignment_attempts' => $delivery->assignment_attempts + 1,
        ])->save();

        return $delivery;
    }

    private function rejectDelivery(DriverProfile $profile, Delivery $delivery): Delivery
    {
        // Only meaningful while the offer is still open; releasing it leaves it
        // pending so the next driver can be offered the same delivery.
        if ($delivery->status === 'pending_assignment') {
            $delivery->increment('assignment_attempts');
        }

        return $delivery;
    }

    private function minutesOnline(DriverProfile $profile): int
    {
        if ($profile->availability !== 'online' || $profile->online_since === null) {
            return 0;
        }

        return $profile->online_since->diffInMinutes(Carbon::now());
    }

    private function profileOrFail(User $user): DriverProfile
    {
        $profile = $user->driverProfile;

        if (! $profile instanceof DriverProfile) {
            throw ResourceNotFoundException::for('Driver profile');
        }

        return $profile;
    }
}
