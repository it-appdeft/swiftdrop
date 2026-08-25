<?php

namespace App\Contracts\Driver;

use App\Models\Delivery;
use App\Models\DriverProfile;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Driver home-screen use-cases: the dashboard snapshot (availability, approval,
 * today's earnings + deliveries, online time, request-timeout), the
 * online/offline toggle, live-location updates, and accept/reject of an
 * incoming delivery request.
 */
interface DriverDashboardServiceInterface
{
    /**
     * Build the home-screen payload from the driver's profile + today's
     * earnings/deliveries.
     *
     * @return array<string, mixed>
     */
    public function dashboard(User $user): array;

    /**
     * Open delivery offers the driver can act on — the pool of unassigned
     * deliveries. Empty unless the driver is approved and online (a fallback
     * for clients that don't receive offers over push). Each row is loaded with
     * its order, restaurant and dropoff address.
     *
     * @return Collection<int, Delivery>
     */
    public function pendingDeliveries(User $user): Collection;

    /** Flip the driver online/offline. Going online requires an approved, fully set-up profile. */
    public function setAvailability(User $user, string $availability): DriverProfile;

    /** Persist the driver's current GPS position on their profile. */
    public function updateLocation(User $user, float $lat, float $lng): DriverProfile;

    /**
     * Accept or reject an offered delivery. Accepting assigns it to the driver
     * (first-come-first-served, guarded against double-assignment); rejecting
     * releases it so it can be offered to the next driver.
     */
    public function respondToDelivery(User $user, int $deliveryId, string $action): Delivery;

    public function getDeliveryTracking(User $user, int $deliveryId): array;

    public function getActiveOrder(User $user): array;

    /**
     * Completed deliveries for the driver's history tab, newest-delivered
     * first. Each row is loaded with its order/restaurant and its earnings
     * ledger entry.
     *
     * @return LengthAwarePaginator<int, Delivery>
     */
    public function deliveryHistory(User $user, int $page, int $perPage): LengthAwarePaginator;
}
