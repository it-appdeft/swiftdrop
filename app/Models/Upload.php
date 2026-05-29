<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\Storage;

/**
 * A single stored attachment (image / file / any upload) owned by any model
 * through a polymorphic `model` morph. Centralises file storage so every
 * feature — menu images, partner documents, review photos — shares one
 * table and one URL convention.
 */
class Upload extends Model
{
    protected $fillable = [
        'model_type',
        'model_id',
        'collection',
        'file',
        'disk',
        'original_name',
        'mime_type',
        'size',
        'sort_order',
    ];

    protected $appends = ['url'];

    protected function casts(): array
    {
        return [
            'size'       => 'integer',
            'sort_order' => 'integer',
        ];
    }

    /** The model this file is attached to (MenuItem, Restaurant, …). */
    public function model(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Public URL for the stored file. For the public disk we return a
     * root-relative "/storage/…" path (matching FoodType's convention) so
     * the browser resolves it against the current origin — avoids broken
     * images when APP_URL's host differs from where the app is served.
     */
    public function getUrlAttribute(): ?string
    {
        if (! $this->file) {
            return null;
        }

        $disk = $this->disk ?: 'public';

        if ($disk === 'public') {
            return '/storage/'.ltrim($this->file, '/');
        }

        return Storage::disk($disk)->url($this->file);
    }

    /** Remove the underlying file from storage, then the row. */
    public function deleteWithFile(): void
    {
        if ($this->file && Storage::disk($this->disk ?: 'public')->exists($this->file)) {
            Storage::disk($this->disk ?: 'public')->delete($this->file);
        }

        $this->delete();
    }
}
