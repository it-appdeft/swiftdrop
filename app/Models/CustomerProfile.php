<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class CustomerProfile extends Model
{
    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'profile_photo',
        'date_of_birth',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(CustomerAddress::class);
    }

    public function defaultAddress(): HasOne
    {
        return $this->hasOne(CustomerAddress::class)->where('is_default', true);
    }

    public function selectedAddress(): HasOne
    {
        return $this->hasOne(CustomerAddress::class)->where('is_selected', true);
    }

    public function searchHistory(): HasMany
    {
        return $this->hasMany(CustomerSearchHistory::class);
    }

    /** Saved-favourites pivots, used to surface is_favorited flags on the customer surfaces. */
    public function favoriteRestaurants(): BelongsToMany
    {
        return $this->belongsToMany(Restaurant::class, 'customer_favorite_restaurants')
            ->withTimestamps();
    }

    public function favoriteMenuItems(): BelongsToMany
    {
        return $this->belongsToMany(MenuItem::class, 'customer_favorite_menu_items')
            ->withTimestamps();
    }
}
