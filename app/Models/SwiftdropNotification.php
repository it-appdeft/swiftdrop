<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SwiftdropNotification extends Model
{
    protected $table = 'swiftdrop_notifications';

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'body',
        'channel',
        'status',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
