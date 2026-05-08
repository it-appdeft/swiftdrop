<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class DriverProfile extends Model
{
    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'profile_photo',
        'vehicle_type',
        'vehicle_make',
        'vehicle_model',
        'vehicle_registration',
        'availability',
        'approval_status',
        'current_lat',
        'current_lng',
    ];

    protected function casts(): array
    {
        return [
            'current_lat' => 'decimal:8',
            'current_lng' => 'decimal:8',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'documentable');
    }

    public function deliveries(): HasMany
    {
        return $this->hasMany(Delivery::class, 'driver_id');
    }

    public function locationLogs(): HasMany
    {
        return $this->hasMany(DriverLocationLog::class, 'driver_id');
    }
}
