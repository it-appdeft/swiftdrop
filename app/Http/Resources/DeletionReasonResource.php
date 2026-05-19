<?php

namespace App\Http\Resources;

use App\Models\DeletionReason;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin DeletionReason */
class DeletionReasonResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'label' => $this->label,
            'slug' => $this->slug,
            'is_other' => $this->isOther(),
            'sort_order' => $this->sort_order,
        ];
    }
}
