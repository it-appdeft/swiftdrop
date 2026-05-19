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
        'country_code',
        'email',
        'password',
        'status',
    ];

    protected $appends = ['name', 'canonical_mobile'];

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
        if ($this->hasRole(UserRoleEnum::RESTAURANT_OWNER->value)) {
            // Restaurant owners go through three stages after registration:
            //   1. Partner application (steps 1–4)           → partner.apply
            //   2. Setup / onboarding (steps 1–8)            → restaurant.onboarding
            //   3. Live dashboard                            → restaurant.dashboard
            $restaurant = $this->restaurant ?? $this->restaurant()->first();

            if (! $restaurant || ! $restaurant->hasSubmittedApplication()) {
                return 'partner.apply';
            }

            if (! $restaurant->hasCompletedOnboarding()) {
                return 'restaurant.onboarding';
            }

            return 'restaurant.dashboard';
        }

        return match (true) {
            $this->hasRole(UserRoleEnum::ADMIN->value) => 'admin.dashboard',
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

    /**
     * Full E.164 mobile (country_code + subscriber digits). Use this whenever
     * something outside the user table needs to address the user by phone
     * — OTP service, SMS gateway, audit log snapshot, etc. — so storage
     * stays normalised (mobile = local digits, country_code = "+44") but
     * callers don't have to glue them back together each time.
     */
    public function getCanonicalMobileAttribute(): ?string
    {
        if (! $this->mobile) {
            return null;
        }

        return ($this->country_code ?? '').$this->mobile;
    }

    /**
     * Best-effort split of a canonical E.164 mobile ("+447789000002") into
     * the persisted shape [country_code, local-digits]. Shared by seeders,
     * registration and OTP-update so storage stays consistent.
     *
     * @return array{0: ?string, 1: ?string}
     */
    public static function splitCanonicalMobile(?string $canonical): array
    {
        if ($canonical === null || $canonical === '') {
            return [null, null];
        }

        if (! str_starts_with($canonical, '+')) {
            return [null, $canonical];
        }

        foreach (['+44', '+91', '+1', '+234'] as $prefix) {
            if (str_starts_with($canonical, $prefix)) {
                return [$prefix, substr($canonical, strlen($prefix))];
            }
        }

        return [null, $canonical];
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
