<?php

namespace Database\Seeders;

use App\Models\Restaurant;
use App\Models\User;
use App\Support\Countries;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class RestaurantSeeder extends Seeder
{
    public function run(): void
    {
        $restaurants = [
            [
                'user'       => ['email' => 'owner@spicegardenldn.co.uk', 'mobile' => '+447933345001', 'status' => 'active'],
                'restaurant' => [
                    'name' => 'Spice Garden',
                    'owner_name' => 'Rohit Mehta',
                    'description' => 'Award-winning North Indian cuisine in the heart of Brick Lane.',
                    'full_address' => '42 Brick Lane, London E1 6RF',
                    'city' => 'London',
                    'pin_code' => 'E1 6RF',
                    'lat' => '51.52180', 'lng' => '-0.07150',
                    'cuisines' => 'Indian',
                    'status' => 'active', 'approval_status' => 'approved',
                    'rating' => '4.70', 'total_reviews' => 312, 'commission_rate' => '10.00',
                ],
            ],
            [
                'user'       => ['email' => 'info@burgersmcr.co.uk', 'mobile' => '+447933345002', 'status' => 'active'],
                'restaurant' => [
                    'name' => 'Smash Burger Co.',
                    'owner_name' => 'Jamie Carter',
                    'description' => 'Hand-smashed beef burgers made fresh to order.',
                    'full_address' => '18 Northern Quarter, Manchester M4 1HF',
                    'city' => 'Manchester',
                    'pin_code' => 'M4 1HF',
                    'lat' => '53.48440', 'lng' => '-2.23230',
                    'cuisines' => 'Burgers',
                    'status' => 'active', 'approval_status' => 'approved',
                    'rating' => '4.50', 'total_reviews' => 198, 'commission_rate' => '12.00',
                ],
            ],
            [
                'user'       => ['email' => 'contact@napolipizza.co.uk', 'mobile' => '+447933345003', 'status' => 'active'],
                'restaurant' => [
                    'name' => 'Napoli Pizza',
                    'owner_name' => 'Luca Romano',
                    'description' => 'Authentic Neapolitan pizza baked in a wood-fired oven.',
                    'full_address' => '7 Broad Street, Ground Floor, Birmingham B1 2EA',
                    'city' => 'Birmingham',
                    'pin_code' => 'B1 2EA',
                    'lat' => '52.47990', 'lng' => '-1.90870',
                    'cuisines' => 'Italian',
                    'status' => 'active', 'approval_status' => 'approved',
                    'rating' => '4.80', 'total_reviews' => 431, 'commission_rate' => '10.00',
                ],
            ],
            [
                'user'       => ['email' => 'hello@sushiwave.co.uk', 'mobile' => '+447933345004', 'status' => 'pending_approval'],
                'restaurant' => [
                    'name' => 'Sushi Wave',
                    'owner_name' => 'Aiko Tanaka',
                    'description' => 'Contemporary Japanese sushi and bento boxes.',
                    'full_address' => '33 The Headrow, Leeds LS1 6PT',
                    'city' => 'Leeds',
                    'pin_code' => 'LS1 6PT',
                    'lat' => '53.79860', 'lng' => '-1.54760',
                    'cuisines' => 'Japanese',
                    'status' => 'pending_approval', 'approval_status' => 'pending',
                    'rating' => '0.00', 'total_reviews' => 0, 'commission_rate' => '10.00',
                ],
            ],
            [
                'user'       => ['email' => 'admin@greenthaibristol.co.uk', 'mobile' => '+447933345005', 'status' => 'active'],
                'restaurant' => [
                    'name' => 'Green Thai Kitchen',
                    'owner_name' => 'Anong Srisai',
                    'description' => 'Fresh, fragrant Thai street food made with imported herbs and spices.',
                    'full_address' => '55 Park Street, Bristol BS1 5NX',
                    'city' => 'Bristol',
                    'pin_code' => 'BS1 5NX',
                    'lat' => '51.45250', 'lng' => '-2.60220',
                    'cuisines' => 'Thai',
                    'status' => 'suspended', 'approval_status' => 'approved',
                    'rating' => '4.20', 'total_reviews' => 87, 'commission_rate' => '11.50',
                ],
            ],
        ];

        foreach ($restaurants as $data) {
            [$countryCode, $localMobile] = User::splitCanonicalMobile($data['user']['mobile']);

            $user = User::firstOrCreate(
                ['email' => $data['user']['email']],
                array_merge($data['user'], [
                    'password' => bcrypt('password'),
                    'country_code' => $countryCode,
                    'country_iso' => Countries::primaryIsoForDial($countryCode),
                    'mobile' => $localMobile,
                ]),
            );

            if (!$user->hasRole('restaurant_owner')) {
                $user->assignRole('restaurant_owner');
            }

            // Mirror owner identity from the user record so the restaurant
            // snapshot matches what the partner application would have written.
            // Mark approved seed rows as fully onboarded so the dashboard gate
            // (terms_accepted_at + application_submitted_at) lets them through.
            $payload = array_merge($data['restaurant'], [
                'owner_email' => $user->email,
                'owner_mobile' => $user->mobile,
            ]);

            if (($payload['approval_status'] ?? null) === 'approved') {
                $payload['application_step'] = 6;
                $payload['terms_accepted_at'] = Carbon::now();
                $payload['application_submitted_at'] = Carbon::now();
            }

            Restaurant::firstOrCreate(
                ['user_id' => $user->id],
                $payload,
            );
        }
    }
}
