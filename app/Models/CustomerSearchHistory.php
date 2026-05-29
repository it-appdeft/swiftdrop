<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerSearchHistory extends Model
{
    protected $table = 'customer_search_history';

    public $timestamps = false;

    protected $fillable = [
        'customer_profile_id',
        'keyword',
        'searched_at',
    ];

    protected function casts(): array
    {
        return [
            'searched_at' => 'datetime',
        ];
    }

    public function customerProfile(): BelongsTo
    {
        return $this->belongsTo(CustomerProfile::class);
    }
}
