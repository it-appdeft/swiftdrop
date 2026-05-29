<?php

namespace Database\Seeders;

use App\Models\FoodType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class FoodTypeSeeder extends Seeder
{
    public function run(): void
    {
        // Items with a `source` ship a bundled icon under
        // public/assets/images/food_items. The rest are taxonomy-only types the
        // MenuAndModifierSeeder maps menu items onto (no icon yet → null image).
        $items = [
            ['name' => 'Pizza',    'slug' => 'pizza',    'source' => 'pizza.png'],
            ['name' => 'Momo',     'slug' => 'momo',     'source' => 'momo.png'],
            ['name' => 'Drinks',   'slug' => 'drinks',   'source' => 'drink.png'],
            ['name' => 'Sandwich', 'slug' => 'sandwich', 'source' => 'sandwich.png'],
            ['name' => 'Burger',   'slug' => 'burger'],
            ['name' => 'Curry',    'slug' => 'curry'],
            ['name' => 'Biryani',  'slug' => 'biryani'],
            ['name' => 'Bread',    'slug' => 'bread'],
            ['name' => 'Noodles',  'slug' => 'noodles'],
            ['name' => 'Starter',  'slug' => 'starter'],
            ['name' => 'Fries',    'slug' => 'fries'],
            ['name' => 'Dessert',  'slug' => 'dessert'],
        ];

        $disk = Storage::disk('public');
        $disk->makeDirectory('food-items');

        foreach ($items as $item) {
            $image = null;

            // Only persist an image path when the bundled asset actually exists,
            // so taxonomy-only types don't end up pointing at a missing file.
            if (! empty($item['source'])) {
                $source = public_path("assets/images/food_items/{$item['source']}");
                $target = "food-items/{$item['source']}";

                if (File::exists($source)) {
                    if (! $disk->exists($target)) {
                        $disk->put($target, File::get($source));
                    }

                    $image = $target;
                }
            }

            FoodType::updateOrCreate(
                ['slug' => $item['slug']],
                ['name' => $item['name'], 'image' => $image],
            );
        }
    }
}
