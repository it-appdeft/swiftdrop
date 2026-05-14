<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Facades\Crypt;

class DriverProfile extends Model
{
    public const SETUP_STEP_NONE = 0;
    public const SETUP_STEP_BANK = 1;
    public const SETUP_STEP_VEHICLE = 2;
    public const SETUP_STEP_DOCUMENTS = 3;
    public const SETUP_TOTAL_STEPS = 3;

    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'profile_photo',
        'date_of_birth',
        'vehicle_type',
        'vehicle_make',
        'vehicle_model',
        'vehicle_registration',
        'vehicle_color',
        'year_of_manufacture',
        'insurance_type',
        'insurance_expiry_date',
        'mot_expiry_date',
        'account_holder_name',
        'account_number',
        'sort_code',
        'bank_name',
        'notify_delivery_updates',
        'notify_general',
        'availability',
        'approval_status',
        'setup_step',
        'current_lat',
        'current_lng',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'insurance_expiry_date' => 'date',
            'mot_expiry_date' => 'date',
            'year_of_manufacture' => 'integer',
            'notify_delivery_updates' => 'boolean',
            'notify_general' => 'boolean',
            'setup_step' => 'integer',
            'current_lat' => 'decimal:8',
            'current_lng' => 'decimal:8',
        ];
    }

    public function isSetupComplete(): bool
    {
        return $this->setup_step >= self::SETUP_STEP_DOCUMENTS;
    }

    public function nextSetupStep(): ?int
    {
        return $this->isSetupComplete() ? null : (int) $this->setup_step + 1;
    }

    protected function accountNumber(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value ? Crypt::decryptString($value) : null,
            set: fn ($value) => $value ? Crypt::encryptString($value) : null,
        );
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
