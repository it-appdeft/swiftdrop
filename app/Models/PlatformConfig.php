<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformConfig extends Model
{
    protected $table = 'platform_config';

    public $timestamps = false;

    protected $fillable = [
        'key',
        'value',
        'description',
        'updated_at',
    ];

    protected function casts(): array
    {
        return [
            'updated_at' => 'datetime',
        ];
    }
}
