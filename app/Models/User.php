<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles;

    protected $fillable = [
        'mobile',
        'email',
        'password',
        'status',
    ];

    protected $appends = ['name'];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function loadProfileRelation(): static
    {
        if ($this->hasRole('customer')) {
            $this->load('customerProfile');
        } elseif ($this->hasRole('driver')) {
            $this->load('driverProfile');
        } elseif ($this->hasRole('restaurant_owner')) {
            $this->load('restaurant');
        }

        return $this;
    }

    public function getNameAttribute(): string
    {
        if ($this->relationLoaded('customerProfile') && $this->customerProfile) {
            return trim("{$this->customerProfile->first_name} {$this->customerProfile->last_name}");
        }
        if ($this->relationLoaded('driverProfile') && $this->driverProfile) {
            return trim("{$this->driverProfile->first_name} {$this->driverProfile->last_name}");
        }
        if ($this->relationLoaded('restaurant') && $this->restaurant) {
            return $this->restaurant->name;
        }

        return $this->email ?? $this->mobile;
    }

    public function customerProfile(): HasOne
    {
        return $this->hasOne(CustomerProfile::class);
    }

    public function driverProfile(): HasOne
    {
        return $this->hasOne(DriverProfile::class);
    }

    public function restaurant(): HasOne
    {
        return $this->hasOne(Restaurant::class);
    }

    public function cart(): HasOne
    {
        return $this->hasOne(Cart::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(SwiftdropNotification::class);
    }
}
