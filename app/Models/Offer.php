<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * A discount coupon. Admins manage these from the Coupons screen; customers
 * apply one per order at checkout. Discount + usage are recorded per order via
 * {@see OfferUsage}.
 */
class Offer extends Model
{
    // Discount mechanics.
    public const TYPE_FLAT = 'flat';
    public const TYPE_PERCENTAGE = 'percentage';
    public const TYPE_FREE_DELIVERY = 'free_delivery';

    public const TYPES = [self::TYPE_FLAT, self::TYPE_PERCENTAGE, self::TYPE_FREE_DELIVERY];

    // Availability gate beyond min-order / validity dates.
    public const TRIGGER_ALL = 'all';      // anyone, anytime within validity
    public const TRIGGER_WELCOME = 'welcome'; // a customer's first N orders
    public const TRIGGER_WEEKEND = 'weekend'; // only Sat/Sun

    public const TRIGGERS = [self::TRIGGER_ALL, self::TRIGGER_WELCOME, self::TRIGGER_WEEKEND];

    protected $fillable = [
        'code',
        'title',
        'description',
        'type',
        'value',
        'min_order_value',
        'max_discount',
        'applicable_to',
        'applicable_id',
        'trigger',
        'max_uses',
        'max_uses_per_user',
        'valid_from',
        'valid_until',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'min_order_value' => 'decimal:2',
            'max_discount' => 'decimal:2',
            'is_active' => 'boolean',
            'valid_from' => 'datetime',
            'valid_until' => 'datetime',
        ];
    }

    public function usages(): HasMany
    {
        return $this->hasMany(OfferUsage::class);
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /** Within the optional valid_from / valid_until window (NULL = open-ended). */
    public function scopeCurrentlyValid(Builder $query, ?Carbon $at = null): Builder
    {
        $at ??= Carbon::now();

        return $query
            ->where(fn (Builder $q) => $q->whereNull('valid_from')->orWhere('valid_from', '<=', $at))
            ->where(fn (Builder $q) => $q->whereNull('valid_until')->orWhere('valid_until', '>=', $at));
    }

    /** Not yet expired — valid_until is in the future or open-ended. Includes coupons whose valid_from is still in the future (those are "upcoming"). */
    public function scopeNotExpired(Builder $query, ?Carbon $at = null): Builder
    {
        $at ??= Carbon::now();

        return $query->where(fn (Builder $q) => $q->whereNull('valid_until')->orWhere('valid_until', '>=', $at));
    }

    public function scopeFilter(Builder $query, array $f): Builder
    {
        return $query
            ->when(filled($f['search'] ?? null), fn (Builder $q) => $q->where(
                fn (Builder $s) => $s->where('code', 'like', '%'.$f['search'].'%')
                    ->orWhere('title', 'like', '%'.$f['search'].'%'),
            ))
            ->when(($f['status'] ?? null) === 'active', fn (Builder $q) => $q->where('is_active', true))
            ->when(($f['status'] ?? null) === 'inactive', fn (Builder $q) => $q->where('is_active', false));
    }
}
