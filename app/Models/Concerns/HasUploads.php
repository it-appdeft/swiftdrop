<?php

namespace App\Models\Concerns;

use App\Models\Upload;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Http\UploadedFile;

/**
 * Gives any model a polymorphic attachment store backed by the `uploads`
 * table. Use it for menu images, partner documents, review photos — any
 * "this record has files" relationship.
 */
trait HasUploads
{
    public function uploads(): MorphMany
    {
        return $this->morphMany(Upload::class, 'model')->orderBy('sort_order')->orderBy('id');
    }

    /** Uploads in a given bucket (e.g. 'image', 'gallery', 'document'). */
    public function uploadsIn(string $collection): MorphMany
    {
        return $this->uploads()->where('collection', $collection);
    }

    /** The most recent upload in a collection, or null. */
    public function latestUpload(?string $collection = null): ?Upload
    {
        $query = $this->uploads()->reorder()->latest('id');

        if ($collection !== null) {
            $query->where('collection', $collection);
        }

        return $query->first();
    }

    /**
     * Store an uploaded file on disk and record it against this model.
     * Returns the created Upload row.
     */
    public function addUpload(
        UploadedFile $file,
        ?string $collection = null,
        string $disk = 'public',
    ): Upload {
        $path = $file->store('uploads/'.$this->getTable(), $disk);

        return $this->uploads()->create([
            'collection'    => $collection,
            'file'          => $path,
            'disk'          => $disk,
            'original_name' => $file->getClientOriginalName(),
            'mime_type'     => $file->getClientMimeType(),
            'size'          => $file->getSize(),
        ]);
    }

    /**
     * Replace every file in a collection with the newly uploaded one —
     * the common "single image" case (menu item photo, logo, …).
     */
    public function replaceUpload(
        UploadedFile $file,
        string $collection,
        string $disk = 'public',
    ): Upload {
        foreach ($this->uploadsIn($collection)->get() as $existing) {
            $existing->deleteWithFile();
        }

        return $this->addUpload($file, $collection, $disk);
    }
}
