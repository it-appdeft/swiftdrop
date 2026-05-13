<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['mobile' => '+447700000001'],
            [
                'email' => 'admin@swiftdrop.co.uk',
                'password' => bcrypt('password'),
                'status' => 'active',
            ],
        );

        $admin->assignRole('admin');
    }
}
