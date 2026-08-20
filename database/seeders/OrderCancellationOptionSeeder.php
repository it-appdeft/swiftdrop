<?php

namespace Database\Seeders;

use App\Models\OrderCancellationOption;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class OrderCancellationOptionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $options = [
            'Ordered by mistake',
            'Want to change items',
            'Delivery time too long',
            'Found a better option',
            'Other'
        ];

        foreach ($options as $option) {
            OrderCancellationOption::firstOrCreate([
                'name' => $option,
            ]);
        }
    }
}
