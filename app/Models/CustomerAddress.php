<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerAddress extends Model
{
    protected $fillable = [
        'customer_profile_id',
        'label',
        'address_line_1',
        'address_line_2',
        'city',
        'county',
        'postcode',
        'delivery_instructions',
        'lat',
        'lng',
        'is_default',
        'is_selected',
    ];

    protected function casts(): array
    {
        return [
            'lat' => 'decimal:8',
            'lng' => 'decimal:8',
            'is_default' => 'boolean',
            'is_selected' => 'boolean',
        ];
    }

    public function customerProfile(): BelongsTo
    {
        return $this->belongsTo(CustomerProfile::class);
    }
}
