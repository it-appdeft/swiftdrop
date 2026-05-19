<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VehicleType extends Model
{
    protected $fillable = [
        'slug',
        'name',
        'requires_insurance',
        'requires_driving_licence',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'requires_insurance' => 'boolean',
            'requires_driving_licence' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public static function findActiveBySlug(?string $slug): ?self
    {
        if (! $slug) {
            return null;
        }

        return static::query()->where('slug', $slug)->where('is_active', true)->first();
    }
}
