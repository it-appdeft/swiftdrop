<?php

namespace App\Services\Driver;

use App\Contracts\Driver\DriverDashboardServiceInterface;
use App\Contracts\Order\OrderStatusTransitionServiceInterface;
use App\Enums\OrderStatusEnum;
use App\Exceptions\InvalidInputException;
use App\Exceptions\ResourceNotFoundException;
use App\Models\CustomerAddress;
use App\Models\Delivery;
use App\Models\DriverEarning;
use App\Models\DriverProfile;
use App\Models\User;
use App\Models\OrderStatusHistory;
use App\Services\Platform\PlatformConfigService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DriverDashboardService implements DriverDashboardServiceInterface
{
    public function __construct(
        protected PlatformConfigService $config,
        protected OrderStatusTransitionServiceInterface $transitions,
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
            ->with([
                'order.restaurant.uploads',
                'order.address',
                'order.items.modifiers',
                'order.review',
                // Only the two milestones the duration needs — see
                // DeliveryHistoryResource, which computes it the same way.
                'order.statusHistories' => fn ($query) => $query->whereIn(
                    'status',
                    [OrderStatusEnum::DRIVER_ASSIGNED, OrderStatusEnum::DELIVERED],
                ),
                'earnings',
            ])
            ->where('driver_id', $profile->id)
            ->find($deliveryId);

        if (! $delivery) {
            throw ResourceNotFoundException::for('Delivery', 'delivery');
        }

        $order = $delivery->order;
        $restaurant = $order?->restaurant;
        $address = $order?->address;
        $review = $order?->review;
        $earnings = $delivery->earnings;

        $assignedAt = $order?->statusHistories->firstWhere('status', OrderStatusEnum::DRIVER_ASSIGNED)?->created_at;
        $durationMinutes = ($assignedAt && $delivery->delivered_at)
            ? (int) round($assignedAt->diffInMinutes($delivery->delivered_at))
            : $delivery->eta_minutes;

        $deliveryFeeEarning = $earnings->firstWhere('type', DriverEarning::TYPE_DELIVERY_FEE);

        return [
            'delivery_id' => $delivery->id,
            // Same short reference shown on the offer card and history list.
            'reference' => $order ? '#CON-'.str_pad((string) $order->id, 4, '0', STR_PAD_LEFT) : null,
            'status' => $order?->status->boardStatus(),
            'placed_at' => optional($order?->placed_at ?? $order?->created_at)->toIso8601String(),
            'distance_miles' => $delivery->distance_miles !== null ? (float) $delivery->distance_miles : null,
            'duration_minutes' => $durationMinutes,
            'restaurant' => $restaurant ? [
                'name' => $restaurant->name,
                'image' => $restaurant->banner_url ?? $restaurant->logo_url,
            ] : null,
            'pickup' => $restaurant ? [
                'name' => $restaurant->name,
                'address' => $restaurant->full_address,
                'lat' => $restaurant->lat !== null ? (float) $restaurant->lat : null,
                'lng' => $restaurant->lng !== null ? (float) $restaurant->lng : null,
            ] : null,
            'dropoff' => $address ? [
                'label' => $address->label,
                'address' => $this->formatAddress($address),
                'instructions' => $address->delivery_instructions,
                'lat' => $address->lat !== null ? (float) $address->lat : null,
                'lng' => $address->lng !== null ? (float) $address->lng : null,
            ] : null,
            'items' => $order?->items->map(fn ($item) => [
                'name' => (string) $item->name,
                'quantity' => (int) $item->quantity,
                'price' => (int) $item->unit_price,
                'modifiers' => $item->modifiers->map(fn ($m) => (string) $m->option_name)->all(),
            ])->all() ?? [],
            // Null until the customer has actually left one.
            'review' => $review ? [
                'rating' => $review->driver_rating !== null ? (int) $review->driver_rating : null,
                'comment' => $review->review_text,
                'date' => optional($review->created_at)->toIso8601String(),
            ] : null,
            'earning' => (float) $earnings->sum('amount') ?? null,
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

        // A driver is now on the order — mint the handover codes (restaurant
        // pickup + customer delivery) and move the order into its
        // driver-assigned phase, logged to order_status_histories like every
        // other transition. Runs in parallel with the kitchen: the restaurant
        // doesn't have to have clicked preparing/ready_for_pickup yet — see
        // OrderStatusTransitionService's ALLOWED_FROM['driver_assigned'] and
        // its catch-up branch for those two milestones arriving "late".
        $order = $delivery->order;
        $this->transitions->transition($order, OrderStatusEnum::DRIVER_ASSIGNED, $profile->user_id, [
            'delivery_code' => (string) random_int(1000, 9999),
            'pick_up_code' => (string) random_int(1000, 9999),
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

    public function getActiveOrder(User $user): array
    {
        $profile = $this->profileOrFail($user);

        $delivery = Delivery::query()
            ->where('driver_id', $profile->id)
            ->whereIn('status',['assigned','picked_up'])
            ->latest()->first();
        $orderStatus = OrderStatusHistory::where('order_id',$delivery->order_id)
            ->latest()->value('status');

        if (! $delivery) {
            throw ResourceNotFoundException::for('Delivery', 'delivery');
        }

        return [
            'delivery_id' => $delivery->id,
            'order_id' => $delivery->order_id,
            'status' => $orderStatus,
        ];
    }

    public function deliveryHistory(User $user, int $page, int $perPage): LengthAwarePaginator
    {
        $profile = $this->profileOrFail($user);

        return Delivery::query()
            ->where('driver_id', $profile->id)
            ->where('status', 'delivered')
            ->with([
                'order.restaurant.uploads',
                // Only the two milestones the history card needs (duration =
                // delivered_at − the driver_assigned timestamp) — see
                // DeliveryHistoryResource.
                'order.statusHistories' => fn ($query) => $query->whereIn(
                    'status',
                    [OrderStatusEnum::DRIVER_ASSIGNED, OrderStatusEnum::DELIVERED],
                ),
                'earnings',
            ])
            ->orderByDesc('delivered_at')
            ->paginate(perPage: $perPage, page: $page);
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

    /** One-line address, same formatting as DeliveryRequestResource's dropoff. */
    private function formatAddress(CustomerAddress $address): string
    {
        return collect([$address->address_line_1, $address->address_line_2, $address->city, $address->postcode])
            ->filter()
            ->implode(', ');
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
