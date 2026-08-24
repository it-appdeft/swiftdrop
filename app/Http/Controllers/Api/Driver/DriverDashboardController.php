<?php

namespace App\Http\Controllers\Api\Driver;

use App\Contracts\Driver\DriverDashboardServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Driver\Dashboard\RespondToDeliveryRequest;
use App\Http\Requests\Driver\Dashboard\ToggleAvailabilityRequest;
use App\Http\Requests\Driver\Dashboard\UpdateLocationRequest;
use App\Http\Resources\Driver\DeliveryRequestResource;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

/**
 * Driver home screen: the dashboard snapshot, online/offline toggle, live
 * location push, and accept/reject of an incoming delivery request. All four
 * sit behind auth:sanctum + the driver prefix (see routes/api.php).
 */
class DriverDashboardController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected DriverDashboardServiceInterface $dashboard,
    ) {
    }

    public function index(): JsonResponse
    {
        $data = $this->dashboard->dashboard(auth('sanctum')->user());

        return $this->success(
            data: $data,
            message: 'Driver dashboard retrieved.',
        );
    }

    public function deliveryRequests(): JsonResponse
    {
        $requests = $this->dashboard->pendingDeliveries(auth('sanctum')->user());

        return $this->success(
            data: DeliveryRequestResource::collection($requests),
            message: 'Delivery requests retrieved.',
        );
    }

    public function toggleAvailability(ToggleAvailabilityRequest $request): JsonResponse
    {
        $profile = $this->dashboard->setAvailability(
            auth('sanctum')->user(),
            $request->availability(),
        );

        return $this->success(
            data: [
                'availability' => $profile->availability,
                'is_online' => $profile->availability === 'online',
            ],
            message: $profile->availability === 'online' ? 'You are now online.' : 'You are now offline.',
        );
    }

    public function updateLocation(UpdateLocationRequest $request): JsonResponse
    {
        $profile = $this->dashboard->updateLocation(
            auth('sanctum')->user(),
            $request->lat(),
            $request->lng(),
        );

        return $this->success(
            data: [
                'lat' => (float) $profile->current_lat,
                'lng' => (float) $profile->current_lng,
            ],
            message: 'Location updated.',
        );
    }

    public function respondToDelivery(RespondToDeliveryRequest $request, int $delivery): JsonResponse
    {
        $result = $this->dashboard->respondToDelivery(
            auth('sanctum')->user(),
            $delivery,
            $request->action(),
        );

        return $this->success(
            data: [
                'delivery_id' => $result->id,
                'status' => $result->status,
                'driver_id' => $result->driver_id,
            ],
            message: $request->action() === 'accept' ? 'Delivery accepted.' : 'Delivery rejected.',
        );
    }

    public function tracking(int $delivery): JsonResponse
    {
        $tracking = $this->dashboard->getDeliveryTracking(
            auth('sanctum')->user(),
            $delivery,
        );

        return $this->success(
            data: $tracking,
            message: 'Delivery tracking retrieved.',
        );
    }

    public function currentActive(): JsonResponse
    {
        $activeOrder = $this->dashboard->getActiveOrder(
            auth('sanctum')->user(),
        );

        return $this->success(
            data: $activeOrder,
            message: 'Active Order',
        );
    }
}
