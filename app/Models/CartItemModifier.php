<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One add-on selected for a {@see CartItem} — e.g. "Size → Large" or
 * "Toppings → Paneer". Stores a snapshot of the group/option name and the
 * surcharge so the line is immune to later partner edits (see migration).
 */
class CartItemModifier extends Model
{
    protected $fillable = [
        'cart_item_id',
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

    public function cartItem(): BelongsTo
    {
        return $this->belongsTo(CartItem::class);
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
