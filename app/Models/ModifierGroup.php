<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Reusable group of selectable add-ons (Size, Toppings, Cheese & Dip…)
 * scoped to a restaurant. The Restaurant > Modifiers screen manages the
 * full lifecycle; the Add Menu Item modal lets the partner attach one or
 * more groups to a dish so the customer can customise their order.
 */
class ModifierGroup extends Model
{
    public const SELECTION_SINGLE = 'single';
    public const SELECTION_MULTIPLE = 'multiple';

    public const SELECTION_TYPES = [
        self::SELECTION_SINGLE,
        self::SELECTION_MULTIPLE,
    ];

    protected $fillable = [
        'restaurant_id',
        'name',
        'description',
        'selection_type',
        'is_price_driver',
        'is_required',
        'min_selections',
        'max_selections',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_price_driver' => 'boolean',
            'is_required'    => 'boolean',
            'min_selections' => 'integer',
            'max_selections' => 'integer',
            'sort_order'     => 'integer',
        ];
    }

    /**
     * Filter the Modifiers list. `search` matches the group name or any of
     * its option names so the partner can find "Cheese & Dip" by typing
     * "mozzarella". Optional — pass the request bag straight through.
     */
    public function scopeFilter(Builder $query, array $f): Builder
    {
        return $query->when(
            filled($f['search'] ?? null),
            fn (Builder $q) => $q->where(function (Builder $sub) use ($f) {
                $term = '%'.$f['search'].'%';
                $sub->where('name', 'like', $term)
                    ->orWhereHas('options', fn (Builder $o) => $o->where('name', 'like', $term));
            }),
        );
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function options(): HasMany
    {
        return $this->hasMany(ModifierOption::class)->orderBy('sort_order');
    }

    public function menuItems(): BelongsToMany
    {
        return $this->belongsToMany(MenuItem::class, 'menu_item_modifier_group')
            ->withPivot('sort_order')
            ->withTimestamps();
    }
}
