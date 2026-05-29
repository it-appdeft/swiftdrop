<?php

namespace Database\Seeders;

use App\Models\User;
use App\Support\Countries;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        [$countryCode, $localMobile] = User::splitCanonicalMobile('+447700000001');

        $admin = User::firstOrCreate(
            ['country_code' => $countryCode, 'mobile' => $localMobile],
            [
                'country_code' => $countryCode,
                'country_iso' => Countries::primaryIsoForDial($countryCode),
                'mobile' => $localMobile,
                'email' => 'admin@swiftdrop.co.uk',
                'password' => bcrypt('password'),
                'status' => 'active',
            ],
        );

        $admin->assignRole('admin');
    }
}
