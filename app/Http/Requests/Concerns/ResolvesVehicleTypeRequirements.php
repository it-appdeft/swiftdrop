<?php

namespace App\Http\Requests\Concerns;

use App\Models\VehicleType;

/**
 * Resolves the driver's effective vehicle type (from the request payload
 * or the persisted profile) so form requests can branch validation on the
 * vehicle's `requires_insurance` / `requires_driving_licence` flags.
 */
trait ResolvesVehicleTypeRequirements
{
    protected ?VehicleType $resolvedVehicleType = null;

    protected bool $resolvedVehicleTypeFetched = false;

    protected function resolveVehicleType(): ?VehicleType
    {
        if ($this->resolvedVehicleTypeFetched) {
            return $this->resolvedVehicleType;
        }

        $slug = $this->input('vehicle_type')
            ?? optional(auth('sanctum')->user()?->driverProfile)->vehicle_type;

        $this->resolvedVehicleType = VehicleType::findActiveBySlug($slug);
        $this->resolvedVehicleTypeFetched = true;

        return $this->resolvedVehicleType;
    }

    protected function requiresInsurance(): bool
    {
        // Default to strict (insurance required) when the vehicle type
        // cannot be resolved — validation will then surface the missing
        // vehicle_type via its own `exists` rule.
        return (bool) ($this->resolveVehicleType()?->requires_insurance ?? true);
    }

    protected function requiresDrivingLicence(): bool
    {
        return (bool) ($this->resolveVehicleType()?->requires_driving_licence ?? true);
    }
}
