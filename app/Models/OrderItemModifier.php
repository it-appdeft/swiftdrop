<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Order counterpart of {@see CartItemModifier}: the add-ons a customer
 * picked for an {@see OrderItem}, snapshotted at placement time so the
 * historical order always reflects exactly what was bought and charged.
 */
class OrderItemModifier extends Model
{
    protected $fillable = [
        'order_item_id',
        'modifier_group_id',
        'modifier_option_id',
        'group_name',
        'option_name',
        'price_delta',
    ];

    protected function casts(): array
    {
        return [
            'price_delta' => 'decimal:2',
        ];
    }

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function option(): BelongsTo
    {
        return $this->belongsTo(ModifierOption::class, 'modifier_option_id');
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(ModifierGroup::class, 'modifier_group_id');
    }
}
