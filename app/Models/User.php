<?php

namespace App\Models;

use App\Enums\UserRoleEnum;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles, HasApiTokens, SoftDeletes;

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
        if ($this->hasRole(UserRoleEnum::CUSTOMER->value)) {
            $this->load('customerProfile');
        } elseif ($this->hasRole(UserRoleEnum::DRIVER->value)) {
            $this->load('driverProfile');
        } elseif ($this->hasRole(UserRoleEnum::RESTAURANT_OWNER->value)) {
            $this->load('restaurant');
        }

        return $this;
    }

    /**
     * Route name for this user's role-specific landing page. Used by auth
     * redirects so each role lands inside its own protected area.
     */
    public function homeRouteName(): string
    {
        return match (true) {
            $this->hasRole(UserRoleEnum::ADMIN->value) => 'admin.dashboard',
            $this->hasRole(UserRoleEnum::RESTAURANT_OWNER->value) => 'restaurant.dashboard',
            $this->hasRole(UserRoleEnum::CUSTOMER->value) => 'customer.dashboard',
            default => 'home',
        };
    }

    // public function getNameAttribute(): string
    // {
    //     if ($this->relationLoaded('customerProfile') && $this->customerProfile) {
    //         return trim("{$this->customerProfile->first_name} {$this->customerProfile->last_name}");
    //     }
    //     if ($this->relationLoaded('driverProfile') && $this->driverProfile) {
    //         return trim("{$this->driverProfile->first_name} {$this->driverProfile->last_name}");
    //     }
    //     if ($this->relationLoaded('restaurant') && $this->restaurant) {
    //         return $this->restaurant->name;
    //     }

    //     return $this->email ?? $this->mobile;
    // }

    public function getNameAttribute(): string
    {
        if ($this->customerProfile) {
            return trim(
                "{$this->customerProfile->first_name} {$this->customerProfile->last_name}"
            );
        }

        if ($this->driverProfile) {
            return trim(
                "{$this->driverProfile->first_name} {$this->driverProfile->last_name}"
            );
        }

        if ($this->restaurant) {
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
