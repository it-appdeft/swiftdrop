<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerAccountDeletionLog extends Model
{
    protected $fillable = [
        'user_id',
        'mobile',
        'email',
        'first_name',
        'last_name',
        'deletion_reason_id',
        'reason_label',
        'reason_slug',
        'description',
        'deleted_at',
    ];

    protected function casts(): array
    {
        return [
            'deleted_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reason(): BelongsTo
    {
        return $this->belongsTo(DeletionReason::class, 'deletion_reason_id');
    }
}
