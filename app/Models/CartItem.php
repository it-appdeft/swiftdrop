<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CartItem extends Model
{
    protected $fillable = [
        'cart_id',
        'menu_item_id',
        'quantity',
        'unit_price',
        'customizations',
    ];

    protected function casts(): array
    {
        return [
            'unit_price' => 'decimal:2',
            'customizations' => 'array',
        ];
    }

    public function cart(): BelongsTo
    {
        return $this->belongsTo(Cart::class);
    }

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class);
    }

    /** Selected add-ons for this line (Size, Toppings, Cheese & Dip…). */
    public function modifiers(): HasMany
    {
        return $this->hasMany(CartItemModifier::class);
    }
}
