<?php

namespace App\Models;

use Illuminate\Contracts\Database\Query\Builder as QueryBuilder;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Carbon;

class Restaurant extends Model
{
    /** Rating cutoff for the customer "Highest rated" filter. */
    public const HIGH_RATING = 4.0;

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
        'accepts_cooking_requests',
        'logo_path',
        'cover_photo_path',
        'status',
        'approval_status',
        'is_accepting_orders',
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
            'accepts_cooking_requests' => 'boolean',
            'rating' => 'decimal:2',
            'commission_rate' => 'decimal:2',
            'is_accepting_orders' => 'boolean',
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

    /** Admin has approved the partner application. */
    public function isApproved(): bool
    {
        return $this->approval_status === 'approved';
    }

    // ─── Query scopes ────────────────────────────────────────────────────────

    /** Restaurants that are live (not suspended / paused). */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    /** Restaurants whose partner application has been approved. */
    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('approval_status', 'approved');
    }

    /**
     * Restaurants within `$radiusMiles` of a coordinate, selecting the
     * Haversine distance as `distance_miles` so callers can order by it.
     * Distance is computed SQL-side so the radius filter stays index-friendly
     * and never pulls every row into PHP.
     */
    public function scopeWithinRadius(Builder $query, float $lat, float $lng, float $radiusMiles): Builder
    {
        $distance = static::distanceMilesExpression($lat, $lng);

        return $query
            ->whereNotNull('restaurants.lat')
            ->whereNotNull('restaurants.lng')
            ->selectRaw("restaurants.*, {$distance} as distance_miles")
            ->whereRaw("{$distance} <= ?", [$radiusMiles]);
    }

    /**
     * One-call customer search filter combining the keyword match with the
     * post-keyword result chips (Offers / Highest rated). Lets callers do
     * `Restaurant::query()->active()->approved()->customerSearch($filters)`
     * instead of stitching three scopes together.
     *
     * @param  array{keyword?: ?string, offers?: bool, highest_rated?: bool}  $filters
     */
    public function scopeCustomerSearch(Builder $query, array $filters): Builder
    {
        return $query
            ->when(filled($filters['keyword'] ?? null), fn (Builder $q) => $q->matchingKeyword((string) $filters['keyword']))
            ->when(! empty($filters['offers']), fn (Builder $q) => $q->withOffers())
            ->when(! empty($filters['highest_rated']), fn (Builder $q) => $q->highRated());
    }

    /**
     * Keyword match: the restaurant's own name, OR it has at least one
     * available menu item whose name (or its linked food_item name) matches.
     */
    public function scopeMatchingKeyword(Builder $query, string $keyword): Builder
    {
        $keyword = trim($keyword);
        if ($keyword === '') {
            return $query;
        }

        return $query->where(function (Builder $w) use ($keyword) {
            $w->where('restaurants.name', 'like', "%{$keyword}%")
                ->orWhereExists(function (QueryBuilder $sub) use ($keyword) {
                    $sub->selectRaw('1')
                        ->from('menu_items')
                        ->leftJoin('food_items', 'food_items.id', '=', 'menu_items.food_item_id')
                        ->whereColumn('menu_items.restaurant_id', 'restaurants.id')
                        ->where('menu_items.is_available', true)
                        ->where(fn (QueryBuilder $x) => $x
                            ->where('food_items.name', 'like', "%{$keyword}%")
                            ->orWhere('menu_items.name', 'like', "%{$keyword}%"));
                });
        });
    }

    /**
     * Customer "Highest rated" search filter — restaurants rated at or above
     * {@see HIGH_RATING}. Column is qualified so the scope also works on
     * queries that join `restaurants` (e.g. the dishes search).
     */
    public function scopeHighRated(Builder $query, ?float $min = null): Builder
    {
        return $query->where('restaurants.rating', '>=', $min ?? self::HIGH_RATING);
    }

    /**
     * Customer "Offers" search filter — restaurants with at least one active,
     * in-window {@see Offer} available to them: either a global ('all') offer
     * or one targeted at this restaurant.
     */
    public function scopeWithOffers(Builder $query): Builder
    {
        return $query->whereExists(fn (QueryBuilder $sub) => self::applyOfferExists($sub));
    }

    /**
     * Correlated "has an applicable, active, valid offer" subquery keyed on
     * `restaurants.id`. Extracted so the dishes search (a MenuItem query that
     * joins `restaurants`) can reuse the exact same predicate as
     * {@see scopeWithOffers()} without duplicating the conditions.
     */
    public static function applyOfferExists(QueryBuilder $sub): QueryBuilder
    {
        $now = Carbon::now();

        return $sub->selectRaw('1')
            ->from('offers')
            ->where('offers.is_active', true)
            ->where(fn (QueryBuilder $q) => $q->whereNull('offers.valid_from')->orWhere('offers.valid_from', '<=', $now))
            ->where(fn (QueryBuilder $q) => $q->whereNull('offers.valid_until')->orWhere('offers.valid_until', '>=', $now))
            ->where(fn (QueryBuilder $q) => $q
                ->where('offers.applicable_to', 'all')
                ->orWhere(fn (QueryBuilder $qq) => $qq
                    ->where('offers.applicable_to', 'restaurant')
                    ->whereColumn('offers.applicable_id', 'restaurants.id')));
    }

    /**
     * Haversine great-circle distance in miles between a fixed coordinate and
     * each row's lat/lng columns, as a raw SQL expression. Single source of
     * truth for {@see scopeWithinRadius()} and the search service's distance
     * ordering (which joins `restaurants` and so passes qualified columns).
     */
    public static function distanceMilesExpression(
        float $lat,
        float $lng,
        string $latColumn = 'restaurants.lat',
        string $lngColumn = 'restaurants.lng',
    ): string {
        $earth = 3958.7613; // miles

        return "({$earth} * acos("
            ."cos(radians({$lat})) * cos(radians({$latColumn})) * "
            ."cos(radians({$lngColumn}) - radians({$lng})) + "
            ."sin(radians({$lat})) * sin(radians({$latColumn}))"
            ."))";
    }

    /**
     * PHP-side Haversine distance in miles from this restaurant to a single
     * coordinate (e.g. the customer's chosen delivery address). Mirrors
     * {@see distanceMilesExpression()} for the one-pair checkout case. Returns
     * null when this restaurant has no coordinates.
     */
    public function distanceMilesFrom(float $lat, float $lng): ?float
    {
        if ($this->lat === null || $this->lng === null) {
            return null;
        }

        $earth = 3958.7613; // miles
        $rLat = (float) $this->lat;
        $rLng = (float) $this->lng;

        $angle = acos(
            min(1.0, cos(deg2rad($lat)) * cos(deg2rad($rLat))
                * cos(deg2rad($rLng) - deg2rad($lng))
                + sin(deg2rad($lat)) * sin(deg2rad($rLat))),
        );

        return round($earth * $angle, 2);
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

    /**
     * Reusable modifier groups (Size, Toppings, Cheese & Dip…) the
     * partner manages from the Restaurant > Modifiers screen. Menu
     * items attach to these via a pivot so one group can power many
     * dishes.
     */
    public function modifierGroups(): HasMany
    {
        return $this->hasMany(ModifierGroup::class)->orderBy('sort_order');
    }

    /** Starter dishes captured during the partner application (Step 5). */
    public function starterMenuItems(): HasMany
    {
        return $this->hasMany(RestaurantMenuItem::class)->orderBy('sort_order');
    }

    /**
     * Food categories the partner picked in Step 1. Replaces the free-text
     * `cuisines` column for new applications — choices come from the
     * admin-managed `food_items` catalog.
     */
    public function foodItems(): BelongsToMany
    {
        return $this->belongsToMany(FoodItem::class, 'restaurant_food_items')
            ->withTimestamps();
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
