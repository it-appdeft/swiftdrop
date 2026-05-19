<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\VehicleTypeResource;
use App\Models\VehicleType;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class VehicleTypeController extends Controller
{
    use ApiResponse;

    /**
     * Lookup list used by the driver app to populate the vehicle-type
     * dropdown. Returned slugs are the same values the setup / update
     * APIs expect on `vehicle_type`. Flags drive conditional UI (e.g.
     * hiding the insurance section for a bicycle).
     */
    public function index(): JsonResponse
    {
        $types = VehicleType::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return $this->success(
            data: VehicleTypeResource::collection($types),
            message: 'Vehicle types retrieved.',
        );
    }
}
