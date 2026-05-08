<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Offer extends Model
{
    protected $fillable = [
        'code',
        'type',
        'value',
        'min_order_value',
        'max_discount',
        'applicable_to',
        'applicable_id',
        'max_uses',
        'max_uses_per_user',
        'valid_from',
        'valid_until',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'min_order_value' => 'decimal:2',
            'max_discount' => 'decimal:2',
            'is_active' => 'boolean',
            'valid_from' => 'datetime',
            'valid_until' => 'datetime',
        ];
    }

    public function usages(): HasMany
    {
        return $this->hasMany(OfferUsage::class);
    }
}
