<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RestaurantHour extends Model
{
    protected $fillable = [
        'restaurant_id',
        'day_of_week',
        'is_open',
        'open_from',
        'open_to',
    ];

    public const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

    protected function casts(): array
    {
        return [
            'is_open' => 'boolean',
        ];
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
}
