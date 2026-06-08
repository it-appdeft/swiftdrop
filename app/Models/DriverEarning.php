<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A single line in a driver's earnings ledger — the fee, tip, bonus or
 * adjustment credited for a delivery. The driver dashboard sums today's rows
 * for the "Today's Earning" figure.
 */
class DriverEarning extends Model
{
    public const TYPE_DELIVERY_FEE = 'delivery_fee';
    public const TYPE_TIP = 'tip';
    public const TYPE_BONUS = 'bonus';
    public const TYPE_ADJUSTMENT = 'adjustment';

    public const STATUS_PENDING = 'pending';
    public const STATUS_PAID = 'paid';

    protected $fillable = [
        'driver_id',
        'delivery_id',
        'order_id',
        'type',
        'amount',
        'status',
        'earned_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'earned_at' => 'datetime',
        ];
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(DriverProfile::class, 'driver_id');
    }

    public function delivery(): BelongsTo
    {
        return $this->belongsTo(Delivery::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
