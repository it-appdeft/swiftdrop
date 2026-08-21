<?php

namespace App\Services\Driver;

use App\Contracts\Driver\DriverDashboardServiceInterface;
use App\Enums\OrderStatusEnum;
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

        $activeDelivery = $profile->deliveries()
            ->whereIn('status', ['assigned', 'picked_up'])
            ->latest('id')
            ->first();

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
            'active_delivery' => $activeDelivery,
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
            ->whereHas('order', function ($query) {
                $query->where('placed_at', '>=', Carbon::now()->subMinutes(10));
            })
            ->latest('id')
            ->get()
            // Only offer a delivery to drivers within the admin-tunable radius of
            // the restaurant (see RestaurantOrderService::accept(), which creates
            // the delivery in the first place). The pool is small, so filtering
            // in PHP after eager-loading the restaurant is simplest.
            ->filter(fn (Delivery $delivery) => $this->withinAssignmentRadius($profile, $delivery))
            ->values();
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

    public function getDeliveryTracking(User $user, int $deliveryId): array
    {
        $profile = $this->profileOrFail($user);

        /** @var Delivery|null $delivery */
        $delivery = Delivery::query()
            ->with(['order.restaurant.uploads', 'order.address'])
            ->where('driver_id', $profile->id)
            ->find($deliveryId);

        if (! $delivery) {
            throw ResourceNotFoundException::for('Delivery', 'delivery');
        }

        return [
            'delivery_id' => $delivery->id,
            'status' => $delivery->status,
            'order' => [
                'id' => $delivery->order->id,
                'placed_at' => optional($delivery->order->placed_at ?? $delivery->order->created_at)->toIso8601String(),
                'status' => $delivery->order->status->boardStatus(),
                'restaurant' => [
                    'name' => $delivery->order->restaurant?->name,
                    'address' => $delivery->order->restaurant?->address,
                    'lat' => $delivery->order->restaurant?->lat !== null ? (float) $delivery->order->restaurant?->lat : null,
                    'lng' => $delivery->order->restaurant?->lng !== null ? (float) $delivery->order->restaurant?->lng : null,
                ],
                'dropoff_address' => [
                    'line_1' => $delivery->order?->address?->address_line_1,
                    'line_2' => $delivery->order?->address?->address_line_2,
                    'city' => $delivery->order?->address?->city,
                    'postcode' => $delivery->order?->address?->postcode,
                ],
            ],
        ];
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
        if (! $this->withinAssignmentRadius($profile, $delivery)) {
            throw InvalidInputException::make("You're outside the delivery range for this order.", 'delivery');
        }

        $delivery->forceFill([
            'driver_id' => $profile->id,
            'status' => 'assigned',
            'assignment_attempts' => $delivery->assignment_attempts + 1,
        ])->save();

        // A driver is now on the order — mint the handover code the customer
        // reads out on delivery, and move the order into its out-for-delivery
        // phase (logged to order_status_histories like every other transition).
        $order = $delivery->order;
        $order->forceFill([
            'delivery_code' => (string) random_int(1000, 9999),
            'status' => OrderStatusEnum::DRIVER_ASSIGNED,
            'pick_up_code' => (string) random_int(1000, 9999)
        ])->save();
        $order->statusHistories()->create([
            'status' => OrderStatusEnum::DRIVER_ASSIGNED,
            'updated_by' => $profile->user_id,
        ]);

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

    /**
     * Whether the driver's last known location is within the admin-configured
     * radius of the delivery's restaurant. Fails closed — an unassignable
     * distance (missing driver location, or a restaurant with no coordinates)
     * is treated as out of range rather than shown/accepted by default.
     */
    private function withinAssignmentRadius(DriverProfile $profile, Delivery $delivery): bool
    {
        if ($profile->current_lat === null || $profile->current_lng === null) {
            return false;
        }

        $restaurant = $delivery->order?->restaurant;
        if (! $restaurant) {
            return false;
        }

        $distance = $restaurant->distanceMilesFrom((float) $profile->current_lat, (float) $profile->current_lng);
        if ($distance === null) {
            return false;
        }

        $radius = $this->config->float(PlatformConfigService::KEY_DRIVER_ASSIGNMENT_RADIUS_MILES, 5.0);

        return $distance <= $radius;
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
