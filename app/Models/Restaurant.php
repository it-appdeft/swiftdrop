<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Restaurant extends Model
{
    protected $fillable = [
        'user_id',
        // Step 1 — Restaurant identity (matches the partner-application UI).
        'name',
        'tagline',
        'legal_business_name',
        'owner_name',
        'owner_email',
        'owner_mobile',
        'restaurant_type',
        'cuisines',
        'branches',
        'seating_capacity',
        'full_address',
        'city',
        'pin_code',
        'lat',
        'lng',
        // Operational state (lifecycle after onboarding).
        'description',
        'logo_path',
        'cover_photo_path',
        'status',
        'approval_status',
        'rating',
        'total_reviews',
        'commission_rate',
        // Application progress (Review step + resume cursor).
        'application_step',
        'terms_accepted_at',
        'application_submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'lat' => 'decimal:8',
            'lng' => 'decimal:8',
            'rating' => 'decimal:2',
            'commission_rate' => 'decimal:2',
            'branches' => 'integer',
            'seating_capacity' => 'integer',
            'application_step' => 'integer',
            'terms_accepted_at' => 'datetime',
            'application_submitted_at' => 'datetime',
        ];
    }

    public function hasSubmittedApplication(): bool
    {
        return $this->application_submitted_at !== null;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function legalAndBank(): HasOne
    {
        return $this->hasOne(RestaurantLegalAndBank::class);
    }

    public function applicationDocuments(): HasOne
    {
        return $this->hasOne(RestaurantDocument::class);
    }

    public function serviceSettings(): HasOne
    {
        return $this->hasOne(RestaurantServiceSettings::class);
    }

    public function deliverySettings(): HasOne
    {
        return $this->hasOne(RestaurantDeliverySettings::class);
    }

    public function hours(): HasMany
    {
        return $this->hasMany(RestaurantHour::class);
    }

    public function galleryImages(): HasMany
    {
        return $this->hasMany(RestaurantGalleryImage::class)->orderBy('sort_order');
    }

    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'documentable');
    }

    public function categories(): HasMany
    {
        return $this->hasMany(MenuCategory::class);
    }

    public function menuItems(): HasMany
    {
        return $this->hasMany(MenuItem::class);
    }

    /** Starter dishes captured during the partner application (Step 5). */
    public function starterMenuItems(): HasMany
    {
        return $this->hasMany(RestaurantMenuItem::class)->orderBy('sort_order');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(ReviewAndRating::class);
    }
}
