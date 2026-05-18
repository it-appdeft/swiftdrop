<?php

namespace Database\Seeders;

use App\Models\DriverProfile;
use App\Models\User;
use Illuminate\Database\Seeder;

class DriverSeeder extends Seeder
{
    public function run(): void
    {
        $drivers = [
            [
                'user'    => ['mobile' => '+447922234001', 'email' => 'ryan.o\'brien@gmail.com', 'status' => 'active'],
                'profile' => [
                    'first_name' => 'Ryan', 'last_name' => "O'Brien",
                    'vehicle_type' => 'motor_bike', 'vehicle_make' => 'Honda', 'vehicle_model' => 'CBF500',
                    'vehicle_registration' => 'LK21 HGF', 'availability' => 'online', 'approval_status' => 'approved',
                    'current_lat' => '51.50900', 'current_lng' => '-0.13450',
                ],
            ],
            [
                'user'    => ['mobile' => '+447922234002', 'email' => 'priya.patel@outlook.com', 'status' => 'active'],
                'profile' => [
                    'first_name' => 'Priya', 'last_name' => 'Patel',
                    'vehicle_type' => 'bicycle', 'vehicle_make' => null, 'vehicle_model' => null,
                    'vehicle_registration' => 'N/A', 'availability' => 'offline', 'approval_status' => 'approved',
                    'current_lat' => null, 'current_lng' => null,
                ],
            ],
            [
                'user'    => ['mobile' => '+447922234003', 'email' => 'marcus.johnson@gmail.com', 'status' => 'active'],
                'profile' => [
                    'first_name' => 'Marcus', 'last_name' => 'Johnson',
                    'vehicle_type' => 'four_wheeler', 'vehicle_make' => 'Toyota', 'vehicle_model' => 'Prius',
                    'vehicle_registration' => 'BF20 XKD', 'availability' => 'online', 'approval_status' => 'approved',
                    'current_lat' => '53.48090', 'current_lng' => '-2.23430',
                ],
            ],
            [
                'user'    => ['mobile' => '+447922234004', 'email' => 'aisha.malik@hotmail.co.uk', 'status' => 'pending_approval'],
                'profile' => [
                    'first_name' => 'Aisha', 'last_name' => 'Malik',
                    'vehicle_type' => 'four_wheeler', 'vehicle_make' => 'Ford', 'vehicle_model' => 'Transit',
                    'vehicle_registration' => 'KY71 TBV', 'availability' => 'offline', 'approval_status' => 'pending',
                    'current_lat' => null, 'current_lng' => null,
                ],
            ],
            [
                'user'    => ['mobile' => '+447922234005', 'email' => 'dan.brooks@gmail.com', 'status' => 'active'],
                'profile' => [
                    'first_name' => 'Dan', 'last_name' => 'Brooks',
                    'vehicle_type' => 'motor_bike', 'vehicle_make' => 'Yamaha', 'vehicle_model' => 'MT-07',
                    'vehicle_registration' => 'SY69 GJR', 'availability' => 'offline', 'approval_status' => 'rejected',
                    'current_lat' => null, 'current_lng' => null,
                ],
            ],
        ];

        foreach ($drivers as $data) {
            [$countryCode, $localMobile] = User::splitCanonicalMobile($data['user']['mobile']);

            $user = User::firstOrCreate(
                ['country_code' => $countryCode, 'mobile' => $localMobile],
                array_merge($data['user'], [
                    'country_code' => $countryCode,
                    'mobile' => $localMobile,
                    'password' => null,
                ]),
            );

            if (!$user->hasRole('driver')) {
                $user->assignRole('driver');
            }

            DriverProfile::firstOrCreate(
                ['user_id' => $user->id],
                $data['profile'],
            );
        }
    }
}
