<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OtpCode extends Model
{
    public const CHANNEL_SMS = 'sms';

    public const CHANNEL_EMAIL = 'email';

    public $timestamps = false;

    protected $fillable = [
        'mobile_or_email',
        'channel',
        'code_hash',
        'expires_at',
        'used_at',
        'attempts',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'used_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isUsed(): bool
    {
        return $this->used_at !== null;
    }
}
