<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One selectable choice inside a {@see ModifierGroup} — e.g.
 * "Regular (serves 1, 17 cm) → £0", "Large (serves 4, 33 cm) → £6.50".
 *
 * Price delta is added on top of the base menu-item price when the
 * customer picks this option.
 */
class ModifierOption extends Model
{
    protected $fillable = [
        'modifier_group_id',
        'name',
        'price_delta',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price_delta' => 'decimal:2',
            'sort_order'  => 'integer',
        ];
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(ModifierGroup::class, 'modifier_group_id');
    }
}
