<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Signature dishes the partner seeds during Step 5 of the application —
 * "Menu starter". The full menu is built out later from the dashboard.
 */
class RestaurantMenuItem extends Model
{
    protected $fillable = [
        'restaurant_id',
        'name',
        'price',
        'diet',
        'sort_order',
    ];

    public const DIETS = ['veg', 'non_veg', 'egg'];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'sort_order' => 'integer',
        ];
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
}
