<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One selectable choice inside a {@see ModifierGroup} — e.g.
 * "Regular (serves 1, 17 cm) → £0", "Large (serves 4, 33 cm) → £6.50".
 *
 * `price_delta` is normally a surcharge added on top of the base
 * menu-item price. But when the parent group is a price-driver
 * (variant/size pricing), it holds the ABSOLUTE price for that option.
 * `is_default` marks the option whose price prefills the item's base
 * Price field — only meaningful on a price-driver group.
 */
class ModifierOption extends Model
{
    protected $fillable = [
        'modifier_group_id',
        'name',
        'price_delta',
        'is_default',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price_delta' => 'decimal:2',
            'is_default'  => 'boolean',
            'sort_order'  => 'integer',
        ];
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(ModifierGroup::class, 'modifier_group_id');
    }
}
