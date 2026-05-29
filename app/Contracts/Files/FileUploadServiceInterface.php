<?php

namespace App\Contracts\Files;

use Illuminate\Http\UploadedFile;

interface FileUploadServiceInterface
{
    public function save(UploadedFile $file, string $folder): string;

    public function delete(string $path): bool;

    public function update(UploadedFile $file, string $folder, ?string $oldPath = null): string;

    public function deleteByUrl(string $url): bool;
}
