<?php

namespace Database\Seeders;

use App\Models\CustomerAddress;
use App\Models\CustomerProfile;
use App\Models\User;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $customers = [
            [
                'user'    => ['mobile' => '+447911123001', 'email' => 'james.taylor@gmail.com', 'status' => 'active'],
                'profile' => ['first_name' => 'James', 'last_name' => 'Taylor', 'date_of_birth' => '1990-03-14'],
                'address' => ['label' => 'Home', 'address_line_1' => '12 Baker Street', 'address_line_2' => null, 'city' => 'London', 'county' => null, 'postcode' => 'NW1 6XE', 'lat' => '51.52370', 'lng' => '-0.15773', 'is_default' => true],
            ],
            [
                'user'    => ['mobile' => '+447911123002', 'email' => 'sophie.williams@hotmail.co.uk', 'status' => 'active'],
                'profile' => ['first_name' => 'Sophie', 'last_name' => 'Williams', 'date_of_birth' => '1995-07-22'],
                'address' => ['label' => 'Home', 'address_line_1' => '45 Oxford Road', 'address_line_2' => 'Flat 3', 'city' => 'Manchester', 'county' => 'Greater Manchester', 'postcode' => 'M13 9PL', 'lat' => '53.46540', 'lng' => '-2.22630', 'is_default' => true],
            ],
            [
                'user'    => ['mobile' => '+447911123003', 'email' => 'mohammed.rahman@outlook.com', 'status' => 'active'],
                'profile' => ['first_name' => 'Mohammed', 'last_name' => 'Rahman', 'date_of_birth' => '1988-11-05'],
                'address' => ['label' => 'Home', 'address_line_1' => '78 Broad Street', 'address_line_2' => null, 'city' => 'Birmingham', 'county' => 'West Midlands', 'postcode' => 'B1 2HF', 'lat' => '52.47910', 'lng' => '-1.90960', 'is_default' => true],
            ],
            [
                'user'    => ['mobile' => '+447911123004', 'email' => 'emily.chen@gmail.com', 'status' => 'suspended'],
                'profile' => ['first_name' => 'Emily', 'last_name' => 'Chen', 'date_of_birth' => '2000-02-18'],
                'address' => ['label' => 'Home', 'address_line_1' => '3 Castle Lane', 'address_line_2' => null, 'city' => 'Leeds', 'county' => 'West Yorkshire', 'postcode' => 'LS2 7EW', 'lat' => '53.79590', 'lng' => '-1.54490', 'is_default' => true],
            ],
            [
                'user'    => ['mobile' => '+447911123005', 'email' => 'oliver.davies@yahoo.co.uk', 'status' => 'pending_approval'],
                'profile' => ['first_name' => 'Oliver', 'last_name' => 'Davies', 'date_of_birth' => '1992-09-30'],
                'address' => ['label' => 'Home', 'address_line_1' => '21 Park Road', 'address_line_2' => null, 'city' => 'Bristol', 'county' => 'Bristol', 'postcode' => 'BS8 1QU', 'lat' => '51.45230', 'lng' => '-2.61670', 'is_default' => true],
            ],
        ];

        foreach ($customers as $data) {
            [$countryCode, $localMobile] = User::splitCanonicalMobile($data['user']['mobile']);

            $user = User::firstOrCreate(
                ['country_code' => $countryCode, 'mobile' => $localMobile],
                array_merge($data['user'], [
                    'country_code' => $countryCode,
                    'mobile' => $localMobile,
                    'password' => bcrypt('password'),
                ]),
            );

            if (!$user->hasRole('customer')) {
                $user->assignRole('customer');
            }

            $profile = CustomerProfile::firstOrCreate(
                ['user_id' => $user->id],
                $data['profile'],
            );

            CustomerAddress::firstOrCreate(
                ['customer_profile_id' => $profile->id, 'postcode' => $data['address']['postcode']],
                $data['address'],
            );
        }
    }
}
