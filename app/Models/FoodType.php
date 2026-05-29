<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FoodType extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'image',
    ];

    protected $appends = ['image_url'];

    public function getImageUrlAttribute(): ?string
    {
        return $this->image ? '/storage/' . ltrim($this->image, '/') : null;
    }

    /** Restaurants that selected this food type during partner onboarding. */
    public function restaurants(): BelongsToMany
    {
        return $this->belongsToMany(Restaurant::class, 'restaurant_food_types')
            ->withTimestamps();
    }

    /** Menu items tagged with this food type (menu_items.food_type_id). */
    public function menuItems(): HasMany
    {
        return $this->hasMany(MenuItem::class);
    }

    /**
     * Food types that the given restaurants actually offer — i.e. have at
     * least one available menu item for. whereHas keeps the result distinct
     * (one row per food type, never duplicated per matching menu item). An
     * empty restaurant list yields no food types.
     *
     * @param  array<int, int>  $restaurantIds
     */
    public function scopeAvailableForRestaurants(Builder $query, array $restaurantIds): Builder
    {
        return $query->whereHas(
            'menuItems',
            fn (Builder $q) => $q
                ->whereIn('restaurant_id', $restaurantIds)
                ->where('is_available', true),
        );
    }
}
