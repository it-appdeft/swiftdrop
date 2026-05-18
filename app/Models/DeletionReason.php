<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DeletionReason extends Model
{
    use SoftDeletes;

    public const SLUG_OTHER = 'other';

    protected $fillable = [
        'role',
        'label',
        'slug',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeForRole(Builder $query, string $role): Builder
    {
        return $query->where('role', $role);
    }

    public function isOther(): bool
    {
        return $this->slug === self::SLUG_OTHER;
    }
}
