<?php

namespace App\Http\Resources\Customer;

use App\Models\CustomerProfile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\UserResource;

/** @mixin CustomerProfile */
class CustomerProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user' => new UserResource($this->user),
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'profile_photo' => $this->profile_photo,
            'date_of_birth' => $this->date_of_birth,
            'addresses' => AddressResource::collection($this->addresses),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
