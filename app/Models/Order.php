<?php

namespace App\Models;

use App\Enums\OrderStatusEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class Order extends Model
{
    /**
     * In-progress statuses — an order in any of these is still live, so its
     * delivery address must not be deleted. Terminal statuses (delivered,
     * cancelled) are excluded.
     */
    public const ACTIVE_STATUSES = ['placed', 'accepted', 'preparing', 'ready_for_pickup', 'out_for_delivery'];

    protected $fillable = [
        'uuid',
        'user_id',
        'restaurant_id',
        'status',
        'subtotal',
        'delivery_fee',
        'discount_amount',
        'vat_amount',
        'total',
        'address_id',
        'special_instructions',
        'cancellation_reason',
        'cancelled_by',
        'delivery_code',
        'pick_up_code',
        'placed_at',
        'accepted_at',
        'preparing_at',
        'ready_at',
        'picked_up_at',
        'delivered_at',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => OrderStatusEnum::class,
            'subtotal' => 'decimal:2',
            'delivery_fee' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'vat_amount' => 'decimal:2',
            'total' => 'decimal:2',
            'placed_at' => 'datetime',
            'accepted_at' => 'datetime',
            'preparing_at' => 'datetime',
            'ready_at' => 'datetime',
            'picked_up_at' => 'datetime',
            'delivered_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    /**
     * Whether the customer can still cancel this order themselves — only
     * while it's sitting unaccepted (any later status means the restaurant,
     * or a driver, is already acting on it).
     */
    public function isCancellable(): bool
    {
        return $this->status === OrderStatusEnum::PLACED;
    }

    protected static function booted(): void
    {
        static::creating(function (Order $order) {
            if (empty($order->uuid)) {
                $order->uuid = (string) Str::uuid();
            }
        });
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    /**
     * The delivery address. Nullable: if the customer deletes the address
     * after ordering, this FK nulls out (see migration), so always guard for
     * a missing address when rendering an order.
     */
    public function address(): BelongsTo
    {
        return $this->belongsTo(CustomerAddress::class, 'address_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    public function delivery(): HasOne
    {
        return $this->hasOne(Delivery::class);
    }

    public function offerUsage(): HasOne
    {
        return $this->hasOne(OfferUsage::class);
    }

    public function review(): HasOne
    {
        return $this->hasOne(ReviewAndRating::class);
    }

    public function statusHistories()
    {
        return $this->hasMany(OrderStatusHistory::class);
    }
}
