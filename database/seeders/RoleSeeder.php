<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $customerRole = Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
        $customerRole->syncPermissions(['orders.view', 'orders.create', 'orders.cancel', 'menu.view', 'restaurants.view']);

        $driverRole = Role::firstOrCreate(['name' => 'driver', 'guard_name' => 'web']);
        $driverRole->syncPermissions(['deliveries.view', 'deliveries.manage', 'orders.view']);

        $restaurantOwnerRole = Role::firstOrCreate(['name' => 'restaurant_owner', 'guard_name' => 'web']);
        $restaurantOwnerRole->syncPermissions(['menu.view', 'menu.create', 'menu.update', 'menu.delete', 'orders.view', 'orders.update', 'restaurants.manage']);

        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $adminRole->syncPermissions(Permission::where('guard_name', 'web')->pluck('name')->all());
    }
}
