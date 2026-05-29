<?php

namespace App\Http\Resources\Driver;

use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Document */
class DriverDocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'file_url' => $this->file_path,
            'original_filename' => $this->original_filename,
            'expires_at' => $this->expires_at,
            'verification_status' => $this->verification_status,
            'rejection_reason' => $this->rejection_reason,
            'verified_at' => $this->verified_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
