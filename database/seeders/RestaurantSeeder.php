<?php

namespace Database\Seeders;

use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Database\Seeder;

class RestaurantSeeder extends Seeder
{
    public function run(): void
    {
        $restaurants = [
            [
                'user'       => ['email' => 'owner@spicegardenldn.co.uk', 'mobile' => '+447933345001', 'status' => 'active'],
                'restaurant' => [
                    'name' => 'Spice Garden', 'description' => 'Award-winning North Indian cuisine in the heart of Brick Lane.',
                    'address_line_1' => '42 Brick Lane', 'address_line_2' => null,
                    'city' => 'London', 'county' => null, 'postcode' => 'E1 6RF',
                    'lat' => '51.52180', 'lng' => '-0.07150',
                    'phone' => '+442071234501', 'cuisine_type' => 'Indian',
                    'status' => 'active', 'approval_status' => 'approved',
                    'rating' => '4.70', 'total_reviews' => 312, 'commission_rate' => '10.00',
                    'vat_number' => 'GB 301 2345 67',
                ],
            ],
            [
                'user'       => ['email' => 'info@burgersmcr.co.uk', 'mobile' => '+447933345002', 'status' => 'active'],
                'restaurant' => [
                    'name' => 'Smash Burger Co.', 'description' => 'Hand-smashed beef burgers made fresh to order.',
                    'address_line_1' => '18 Northern Quarter', 'address_line_2' => null,
                    'city' => 'Manchester', 'county' => 'Greater Manchester', 'postcode' => 'M4 1HF',
                    'lat' => '53.48440', 'lng' => '-2.23230',
                    'phone' => '+441612345502', 'cuisine_type' => 'Burgers',
                    'status' => 'active', 'approval_status' => 'approved',
                    'rating' => '4.50', 'total_reviews' => 198, 'commission_rate' => '12.00',
                    'vat_number' => null,
                ],
            ],
            [
                'user'       => ['email' => 'contact@napolipizza.co.uk', 'mobile' => '+447933345003', 'status' => 'active'],
                'restaurant' => [
                    'name' => 'Napoli Pizza', 'description' => 'Authentic Neapolitan pizza baked in a wood-fired oven.',
                    'address_line_1' => '7 Broad Street', 'address_line_2' => 'Ground Floor',
                    'city' => 'Birmingham', 'county' => 'West Midlands', 'postcode' => 'B1 2EA',
                    'lat' => '52.47990', 'lng' => '-1.90870',
                    'phone' => '+441212345503', 'cuisine_type' => 'Italian',
                    'status' => 'active', 'approval_status' => 'approved',
                    'rating' => '4.80', 'total_reviews' => 431, 'commission_rate' => '10.00',
                    'vat_number' => 'GB 402 8765 43',
                ],
            ],
            [
                'user'       => ['email' => 'hello@sushiwave.co.uk', 'mobile' => '+447933345004', 'status' => 'pending_approval'],
                'restaurant' => [
                    'name' => 'Sushi Wave', 'description' => 'Contemporary Japanese sushi and bento boxes.',
                    'address_line_1' => '33 The Headrow', 'address_line_2' => null,
                    'city' => 'Leeds', 'county' => 'West Yorkshire', 'postcode' => 'LS1 6PT',
                    'lat' => '53.79860', 'lng' => '-1.54760',
                    'phone' => '+441132345504', 'cuisine_type' => 'Japanese',
                    'status' => 'pending_approval', 'approval_status' => 'pending',
                    'rating' => '0.00', 'total_reviews' => 0, 'commission_rate' => '10.00',
                    'vat_number' => null,
                ],
            ],
            [
                'user'       => ['email' => 'admin@greenthaibristol.co.uk', 'mobile' => '+447933345005', 'status' => 'active'],
                'restaurant' => [
                    'name' => 'Green Thai Kitchen', 'description' => 'Fresh, fragrant Thai street food made with imported herbs and spices.',
                    'address_line_1' => '55 Park Street', 'address_line_2' => null,
                    'city' => 'Bristol', 'county' => 'Bristol', 'postcode' => 'BS1 5NX',
                    'lat' => '51.45250', 'lng' => '-2.60220',
                    'phone' => '+441172345505', 'cuisine_type' => 'Thai',
                    'status' => 'suspended', 'approval_status' => 'approved',
                    'rating' => '4.20', 'total_reviews' => 87, 'commission_rate' => '11.50',
                    'vat_number' => 'GB 198 5432 10',
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
                    'mobile' => $localMobile,
                ]),
            );

            if (!$user->hasRole('restaurant_owner')) {
                $user->assignRole('restaurant_owner');
            }

            Restaurant::firstOrCreate(
                ['user_id' => $user->id],
                $data['restaurant'],
            );
        }
    }
}
