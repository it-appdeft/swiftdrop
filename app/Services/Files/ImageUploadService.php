<?php

namespace App\Services\Files;

use App\Contracts\Files\FileUploadServiceInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageUploadService implements FileUploadServiceInterface
{
    protected string $disk = 'public';

    /**
     * Save an uploaded image file.
     *
     * Returns a host-less URL (e.g. "/storage/profile/file.png") so the
     * stored value works regardless of which host serves the app
     * (localhost, 127.0.0.1:8000, or the production domain). The browser
     * resolves the relative path against whatever origin loaded the page.
     *
     * @param UploadedFile $file
     * @param string $folder Folder name (e.g., 'profile', 'restaurant')
     * @return string The saved file URL (relative)
     */
    public function save(UploadedFile $file, string $folder): string
    {
        $this->ensureFolderExists($folder);

        $filename = $this->generateFilename($file);
        $path = "{$folder}/{$filename}";

        $file->storeAs($folder, $filename, $this->disk);

        return "/storage/{$path}";
    }

    /**
     * Delete an image file
     *
     * @param string $path The file path relative to storage disk
     * @return bool
     */
    public function delete(string $path): bool
    {
        if (! $path || ! Storage::disk($this->disk)->exists($path)) {
            return false;
        }

        return Storage::disk($this->disk)->delete($path);
    }

    /**
     * Delete old image and save new one
     *
     * @param UploadedFile $file
     * @param string $folder
     * @param string|null $oldPath
     * @return string The new file URL
     */
    public function update(UploadedFile $file, string $folder, ?string $oldPath = null): string
    {
        if ($oldPath) {
            $this->deleteByUrl($oldPath);
        }

        return $this->save($file, $folder);
    }

    /**
     * Delete file by URL
     *
     * @param string $url
     * @return bool
     */
    public function deleteByUrl(string $url): bool
    {
        if (! $url) {
            return false;
        }

        // Accept either the relative form ("/storage/profile/x.png" — what
        // save() now returns) or a legacy absolute URL written before the
        // host-less switch. Strip both prefixes; whichever applies wins.
        $storagePath = $url;
        $absolutePrefix = Storage::disk($this->disk)->url('');
        if ($absolutePrefix && str_starts_with($storagePath, $absolutePrefix)) {
            $storagePath = substr($storagePath, strlen($absolutePrefix));
        }
        if (str_starts_with($storagePath, '/storage/')) {
            $storagePath = substr($storagePath, strlen('/storage/'));
        }

        return $this->delete($storagePath);
    }

    /**
     * Ensure folder exists in storage
     */
    protected function ensureFolderExists(string $folder): void
    {
        if (! Storage::disk($this->disk)->exists($folder)) {
            Storage::disk($this->disk)->makeDirectory($folder, 0755, true);
        }
    }

    /**
     * Generate unique filename for the uploaded file
     */
    protected function generateFilename(UploadedFile $file): string
    {
        $extension = $file->getClientOriginalExtension();
        $name = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));

        return "{$name}-" . uniqid() . ".{$extension}";
    }
}
