<?php

namespace App\Models;

use App\Enums\TicketSourceEnum;
use App\Enums\TicketStatusEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupportTicket extends Model
{
    protected $fillable = [
        'user_id',
        'source',
        'restaurant_id',
        'order_reference',
        'category',
        'subject',
        'description',
        'status',
        'assigned_to',
    ];

    protected function casts(): array
    {
        return [
            'source' => TicketSourceEnum::class,
            'status' => TicketStatusEnum::class,
        ];
    }

    /** Human-readable reference shared with the user, e.g. "SWT-0042". */
    public function getReferenceAttribute(): string
    {
        return 'SWT-'.str_pad((string) $this->id, 4, '0', STR_PAD_LEFT);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
