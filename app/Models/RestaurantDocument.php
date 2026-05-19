<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Partner-application document slots — six fixed paths per restaurant. The
 * separate row keeps blob-shaped data off the main `restaurants` table and
 * lets admin queries `whereNotNull('menu_path')` etc. directly.
 */
class RestaurantDocument extends Model
{
    protected $fillable = [
        'restaurant_id',
        'gst_certificate_path',
        'fssai_license_path',
        'pan_card_path',
        'cancelled_cheque_path',
        'owner_id_proof_path',
        'menu_path',
    ];

    /**
     * Map between the UI's document-type keys and the column that stores
     * each path. Centralized so the controller and request stay in lockstep.
     */
    public const TYPE_TO_COLUMN = [
        'gstCert' => 'gst_certificate_path',
        'fssai' => 'fssai_license_path',
        'pan' => 'pan_card_path',
        'cancelledCheque' => 'cancelled_cheque_path',
        'ownerId' => 'owner_id_proof_path',
        'menu' => 'menu_path',
    ];

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
}
