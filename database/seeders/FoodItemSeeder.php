<?php

namespace Database\Seeders;

use App\Models\FoodItem;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class FoodItemSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['name' => 'Pizza',    'slug' => 'pizza',    'source' => 'pizza.png'],
            ['name' => 'Momo',     'slug' => 'momo',     'source' => 'momo.png'],
            ['name' => 'Drinks',   'slug' => 'drinks',   'source' => 'drink.png'],
            ['name' => 'Sandwich', 'slug' => 'sandwich', 'source' => 'sandwich.png'],
        ];

        $disk = Storage::disk('public');
        $disk->makeDirectory('food-items');

        foreach ($items as $item) {
            $source = public_path("assets/images/food_items/{$item['source']}");
            $target = "food-items/{$item['source']}";

            if (File::exists($source) && ! $disk->exists($target)) {
                $disk->put($target, File::get($source));
            }

            FoodItem::updateOrCreate(
                ['slug' => $item['slug']],
                ['name' => $item['name'], 'image' => $target],
            );
        }
    }
}
