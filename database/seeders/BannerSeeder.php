<?php

namespace Database\Seeders;

use App\Models\Banner;
use Illuminate\Database\Seeder;
use Illuminate\Http\UploadedFile;

class BannerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $items = [
            [
                'title' => 'Banner 1',
                'status' => 'active',
                'image' => public_path('assets/images/banners/banner1.png'),
            ],
            [
                'title' => 'Banner 2',
                'status' => 'inactive',
                'image' => public_path('assets/images/banners/banner2.png'),
            ],
        ];

        foreach ($items as $data) {
            $banner = Banner::query()->updateOrCreate(
                ['title' => $data['title']],
                ['status' => $data['status']],
            );

            if (! is_file($data['image'])) {
                continue;
            }

            // Clean up broken upload rows (stored path invalid/empty).
            $banner->uploadsIn('image')->get()->each(function ($upload) {
                if (empty($upload->file) || $upload->file === '0' || ! $upload->getRawOriginal('file')) {
                    $upload->delete();
                }
            });

            if (! $banner->uploadsIn('image')->exists()) {
                $uploadedFile = new UploadedFile(
                    $data['image'],
                    basename($data['image']),
                    mime_content_type($data['image']) ?: null,
                    null,
                    true, // test mode so is_file() on the raw path works
                );

                if ($uploadedFile->isValid()) {
                    $banner->replaceUpload($uploadedFile, 'image');
                }
            }
        }
    }
}
