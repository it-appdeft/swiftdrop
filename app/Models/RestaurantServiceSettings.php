<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RestaurantServiceSettings extends Model
{
    protected $table = 'restaurant_service_settings';

    protected $fillable = [
        'restaurant_id',
        'delivery_radius_km',
        'avg_prep_time_min',
        'min_order_amount',
        'avg_ticket_size',
    ];

    protected function casts(): array
    {
        return [
            'delivery_radius_km' => 'integer',
            'avg_prep_time_min' => 'integer',
            'min_order_amount' => 'decimal:2',
            'avg_ticket_size' => 'decimal:2',
        ];
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
}
