<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Restaurant extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'description',
        'address_line_1',
        'address_line_2',
        'city',
        'county',
        'postcode',
        'lat',
        'lng',
        'phone',
        'cuisine_type',
        'logo_path',
        'cover_photo_path',
        'status',
        'approval_status',
        'rating',
        'total_reviews',
        'commission_rate',
        'vat_number',
    ];

    protected function casts(): array
    {
        return [
            'lat' => 'decimal:8',
            'lng' => 'decimal:8',
            'rating' => 'decimal:2',
            'commission_rate' => 'decimal:2',
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

    public function categories(): HasMany
    {
        return $this->hasMany(MenuCategory::class);
    }

    public function menuItems(): HasMany
    {
        return $this->hasMany(MenuItem::class);
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
