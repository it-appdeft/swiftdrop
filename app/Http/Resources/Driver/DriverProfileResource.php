<?php

namespace App\Http\Resources\Driver;

use App\Http\Resources\UserResource;
use App\Models\DriverProfile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin DriverProfile */
class DriverProfileResource extends JsonResource
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
            'vehicle' => [
                'vehicle_type' => $this->vehicle_type,
                'registration_number' => $this->vehicle_registration,
                'vehicle_make' => $this->vehicle_make,
                'vehicle_model' => $this->vehicle_model,
                'vehicle_color' => $this->vehicle_color,
                'year_of_manufacture' => $this->year_of_manufacture,
                'insurance_type' => $this->insurance_type,
                'insurance_expiry_date' => $this->insurance_expiry_date,
                'mot_expiry_date' => $this->mot_expiry_date,
            ],
            'bank' => [
                'account_holder_name' => $this->account_holder_name,
                'account_number' => $this->maskedAccountNumber(),
                'sort_code' => $this->sort_code,
                'bank_name' => $this->bank_name,
            ],
            'notifications' => [
                'notify_delivery_updates' => $this->notify_delivery_updates,
                'notify_general' => $this->notify_general,
            ],
            'availability' => $this->availability,
            'approval_status' => $this->approval_status,
            'setup' => [
                'current_step' => (int) $this->setup_step,
                'next_step' => $this->nextSetupStep(),
                'total_steps' => \App\Models\DriverProfile::SETUP_TOTAL_STEPS,
                'is_complete' => $this->isSetupComplete(),
            ],
            'documents' => DriverDocumentResource::collection($this->documents),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    protected function maskedAccountNumber(): ?string
    {
        $number = $this->account_number;
        if (! $number) {
            return null;
        }

        $len = strlen($number);
        if ($len <= 4) {
            return str_repeat('*', $len);
        }

        return str_repeat('*', $len - 4).substr($number, -4);
    }
}
