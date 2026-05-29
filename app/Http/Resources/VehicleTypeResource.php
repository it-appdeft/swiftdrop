<?php

namespace App\Http\Resources;

use App\Models\VehicleType;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin VehicleType */
class VehicleTypeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'slug' => $this->slug,
            'name' => $this->name,
            'requires_insurance' => $this->requires_insurance,
            'requires_driving_licence' => $this->requires_driving_licence,
        ];
    }
}
