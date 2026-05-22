<?php

namespace App\Models;

use App\Models\Concerns\HasUploads;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class MenuItem extends Model
{
    use HasUploads;

    protected $fillable = [
        'restaurant_id',
        'category_id',
        'food_item_id',
        'name',
        'description',
        'price',
        'is_available',
        'is_veg',
        'allergens',
        'calories',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'is_available' => 'boolean',
            'is_veg' => 'boolean',
            'allergens' => 'array',
        ];
    }

    /**
     * Apply the Menu Management grid filters. Every clause is optional, so
     * the controller can hand the whole request bag straight in:
     *
     *   $restaurant->menuItems()->filter($filters)->get();
     *
     * Keys: search, category, diet ('veg'|'non_veg'), price_min, price_max,
     * group_ids[] (match items attached to ANY of the given groups).
     */
    public function scopeFilter(Builder $query, array $f): Builder
    {
        return $query->when(
                filled($f['search'] ?? null),
                fn (Builder $q) => $q->where('name', 'like', '%'.$f['search'].'%'),
            )->when(
                filled($f['category'] ?? null) && $f['category'] !== 'all',
                fn (Builder $q) => $q->where('category_id', $f['category']),
            )->when(
                filled($f['diet'] ?? null) && $f['diet'] !== 'all',
                fn (Builder $q) => $q->where('is_veg', $f['diet'] === 'veg'),
            )->when(
                filled($f['price_min'] ?? null),
                fn (Builder $q) => $q->where('price', '>=', (float) $f['price_min']),
            )->when(
                filled($f['price_max'] ?? null),
                fn (Builder $q) => $q->where('price', '<=', (float) $f['price_max']),
            )->when(
                ! empty($f['group_ids']),
                fn (Builder $q) => $q->whereHas(
                    'modifierGroups',
                    fn (Builder $g) => $g->whereIn('modifier_groups.id', (array) $f['group_ids']),
                ),
            );
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(MenuCategory::class, 'category_id');
    }

    public function foodItem(): BelongsTo
    {
        return $this->belongsTo(FoodItem::class);
    }

    /**
     * Modifier groups attached to this item. Ordering follows the
     * pivot's sort_order so the partner controls which group customers
     * see first (Size before Toppings before Dips, by default).
     */
    public function modifierGroups(): BelongsToMany
    {
        return $this->belongsToMany(ModifierGroup::class, 'menu_item_modifier_group')
            ->withPivot('sort_order')
            ->orderBy('menu_item_modifier_group.sort_order')
            ->withTimestamps();
    }
}
