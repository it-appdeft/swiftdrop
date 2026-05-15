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
     * Save an uploaded image file
     *
     * @param UploadedFile $file
     * @param string $folder Folder name (e.g., 'profile', 'restaurant')
     * @return string The saved file path
     */
    public function save(UploadedFile $file, string $folder): string
    {
        $this->ensureFolderExists($folder);

        $filename = $this->generateFilename($file);
        $path = "{$folder}/{$filename}";

        $file->storeAs($folder, $filename, $this->disk);

        return Storage::disk($this->disk)->url($path);
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

        $storagePath = str_replace(Storage::disk($this->disk)->url(''), '', $url);

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
