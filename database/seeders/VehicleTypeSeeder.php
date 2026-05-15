<?php

namespace Database\Seeders;

use App\Models\VehicleType;
use Illuminate\Database\Seeder;

class VehicleTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            [
                'slug' => 'bicycle',
                'name' => '2 Wheeler (Bicycle)',
                'requires_insurance' => false,
                'requires_driving_licence' => false,
                'sort_order' => 1,
            ],
            [
                'slug' => 'motor_bike',
                'name' => '2 Wheeler (Motor Bike)',
                'requires_insurance' => true,
                'requires_driving_licence' => true,
                'sort_order' => 2,
            ],
            [
                'slug' => 'three_wheeler',
                'name' => '3 Wheeler',
                'requires_insurance' => true,
                'requires_driving_licence' => true,
                'sort_order' => 3,
            ],
            [
                'slug' => 'four_wheeler',
                'name' => '4 Wheeler',
                'requires_insurance' => true,
                'requires_driving_licence' => true,
                'sort_order' => 4,
            ],
        ];

        foreach ($types as $type) {
            VehicleType::updateOrCreate(
                ['slug' => $type['slug']],
                array_merge($type, ['is_active' => true]),
            );
        }
    }
}
