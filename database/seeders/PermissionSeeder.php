<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = [
            // Order permissions
            'orders.view', 'orders.create', 'orders.update', 'orders.cancel',
            // Menu permissions
            'menu.view', 'menu.create', 'menu.update', 'menu.delete',
            // Restaurant permissions
            'restaurants.view', 'restaurants.manage',
            // Driver permissions
            'deliveries.view', 'deliveries.manage',
            // Admin permissions
            'users.view', 'users.manage',
            'documents.approve', 'documents.reject',
            'offers.manage', 'config.manage',
            'reports.view',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }
    }
}
