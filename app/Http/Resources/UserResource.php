<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            // Split storage: country_code holds the dialling prefix ("+44"),
            // mobile holds the subscriber-only digits. Clients that need the
            // full E.164 string can read `canonical_mobile`.
            'country_code' => $this->country_code,
            'mobile' => $this->mobile,
            'canonical_mobile' => $this->canonical_mobile,
            'status' => $this->status,
            'roles' => $this->getRoleNames(),
            'created_at' => $this->created_at,
            'profile' => $this->whenLoaded('customerProfile', fn() => $this->customerProfile)
                  ?? $this->whenLoaded('driverProfile',   fn() => $this->driverProfile)
                  ?? $this->whenLoaded('restaurant',      fn() => $this->restaurant),
    ];
    }
}
