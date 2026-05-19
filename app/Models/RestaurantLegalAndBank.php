<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Legal identifiers and bank account details captured in Step 2 of the
 * partner application. One-to-one with {@see Restaurant}.
 */
class RestaurantLegalAndBank extends Model
{
    protected $table = 'restaurant_legal_and_bank';

    protected $fillable = [
        'restaurant_id',
        'gst_number',
        'fssai_license',
        'pan_number',
        'account_holder_name',
        'bank_name',
        'account_number',
        'ifsc_code',
    ];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
}
