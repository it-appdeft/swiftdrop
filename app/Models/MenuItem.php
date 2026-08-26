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
        'food_type_id',
        'name',
        'description',
        'price',
        'is_available',
        'is_veg',
        'prep_time',
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

    // ─── Query scopes ────────────────────────────────────────────────────────

    /** Only items the partner currently has switched on. */
    public function scopeAvailable(Builder $query): Builder
    {
        return $query->where('is_available', true);
    }

    /**
     * Customer-facing restaurant-detail filters in one call: diet (veg /
     * non_veg) and the "Ratings 4.0+" chip. menu_items carry no own rating,
     * so the rating filter gates on the parent restaurant's rating (the value
     * surfaced per dish on the detail page).
     *
     * @param  array{diet?: ?string, min_rating?: float|int|bool|null}  $filters
     */
    public function scopeCustomerFilter(Builder $query, array $filters): Builder
    {
        $diet = $filters['diet'] ?? null;
        $minRating = $filters['min_rating'] ?? null;

        return $query
            ->when(
                in_array($diet, ['veg', 'non_veg'], true),
                fn (Builder $q) => $q->where('is_veg', $diet === 'veg'),
            )
            ->when(
                $minRating !== null && (float) $minRating > 0,
                fn (Builder $q) => $q->whereHas(
                    'restaurant',
                    fn (Builder $r) => $r->where('restaurants.rating', '>=', (float) $minRating),
                ),
            );
    }

    public function scopeForRestaurant(Builder $query, int $restaurantId): Builder
    {
        return $query->where('restaurant_id', $restaurantId);
    }

    /**
     * Items whose own name OR linked food-type name matches the keyword —
     * the "recommended / related to your search" filter on the restaurant page.
     */
    public function scopeMatchingKeyword(Builder $query, string $keyword): Builder
    {
        return $query->where(function (Builder $w) use ($keyword) {
            $w->where('name', 'like', "%{$keyword}%")
                ->orWhereHas('foodType', fn (Builder $f) => $f->where('name', 'like', "%{$keyword}%"));
        });
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(MenuCategory::class, 'category_id');
    }

    public function foodType(): BelongsTo
    {
        return $this->belongsTo(FoodType::class);
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

    /**
     * Per-dish prices for price-driver (size) options. The pivot's `price`
     * is this dish's absolute price for that option; the presence of a row
     * also means the dish offers that option. See the menu_item_modifier_option
     * table.
     */
    public function modifierOptions(): BelongsToMany
    {
        return $this->belongsToMany(ModifierOption::class, 'menu_item_modifier_option')
            ->withPivot('price')
            ->withTimestamps();
    }
}
