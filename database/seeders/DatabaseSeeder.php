<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            PermissionSeeder::class,
            RoleSeeder::class,
            PlatformConfigSeeder::class,
            VehicleTypeSeeder::class,
            DeletionReasonSeeder::class,
            AdminUserSeeder::class,
            CustomerSeeder::class,
            DriverSeeder::class,
            RestaurantSeeder::class,
        ]);
    }
}
