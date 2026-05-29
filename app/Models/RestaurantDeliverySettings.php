<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RestaurantDeliverySettings extends Model
{
    protected $table = 'restaurant_delivery_settings';

    protected $fillable = [
        'restaurant_id',
        'auto_accept_orders',
        'estimated_prep_time_min',
        'packaging_charges',
        'tax_type',
        'cancellation_cutoff_min',
    ];

    protected function casts(): array
    {
        return [
            'auto_accept_orders' => 'boolean',
            'estimated_prep_time_min' => 'integer',
            'packaging_charges' => 'decimal:2',
            'cancellation_cutoff_min' => 'integer',
        ];
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
}
