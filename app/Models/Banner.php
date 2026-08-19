<?php

namespace App\Models;

use App\Models\Concerns\HasUploads;
use Illuminate\Database\Eloquent\Model;

class Banner extends Model
{
    use HasUploads;

    protected $fillable = [
        'title',
        'status',
    ];

    protected $appends = ['image_url'];

    protected function casts(): array
    {
        return [
            'status' => 'string',
        ];
    }

    public function getImageUrlAttribute(): ?string
    {
        $upload = $this->relationLoaded('uploads')
            ? $this->uploads->where('collection', 'image')->sortByDesc('id')->first()
            : $this->latestUpload('image');

        return $upload?->url;
    }
}
