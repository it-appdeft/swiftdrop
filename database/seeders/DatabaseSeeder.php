<?php

namespace Database\Seeders;

use App\Models\CustomerAddress;
use App\Models\CustomerProfile;
use App\Models\DriverProfile;
use App\Models\PlatformConfig;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $this->seedRolesAndPermissions();
        $this->seedPlatformConfig();
        $this->seedAdminUser();
        $this->seedDummyCustomers();
        $this->seedDummyDrivers();
        $this->seedDummyRestaurants();
    }

    private function seedRolesAndPermissions(): void
    {
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

        $customerRole = Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
        $customerRole->syncPermissions(['orders.view', 'orders.create', 'orders.cancel', 'menu.view', 'restaurants.view']);

        $driverRole = Role::firstOrCreate(['name' => 'driver', 'guard_name' => 'web']);
        $driverRole->syncPermissions(['deliveries.view', 'deliveries.manage', 'orders.view']);

        $restaurantOwnerRole = Role::firstOrCreate(['name' => 'restaurant_owner', 'guard_name' => 'web']);
        $restaurantOwnerRole->syncPermissions(['menu.view', 'menu.create', 'menu.update', 'menu.delete', 'orders.view', 'orders.update', 'restaurants.manage']);

        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $adminRole->syncPermissions($permissions);
    }

    private function seedPlatformConfig(): void
    {
        $configs = [
            ['key' => 'vat_rate', 'value' => '20.00', 'description' => 'UK VAT rate (%)'],
            ['key' => 'default_commission_rate', 'value' => '10.00', 'description' => 'Default restaurant commission (%)'],
            ['key' => 'otp_expiry_minutes', 'value' => '10', 'description' => 'OTP validity window in minutes'],
            ['key' => 'max_driver_assignment_attempts', 'value' => '3', 'description' => 'Max driver reassignment attempts before admin escalation'],
            ['key' => 'driver_location_update_interval_seconds', 'value' => '5', 'description' => 'How often drivers push location updates'],
            ['key' => 'restaurant_accept_timeout_minutes', 'value' => '10', 'description' => 'Auto-cancel if restaurant does not accept within this time'],
            ['key' => 'base_delivery_fee_gbp', 'value' => '1.99', 'description' => 'Base delivery fee in GBP'],
            ['key' => 'free_delivery_threshold_gbp', 'value' => '25.00', 'description' => 'Order total above which delivery is free'],
        ];

        foreach ($configs as $config) {
            PlatformConfig::firstOrCreate(
                ['key' => $config['key']],
                ['value' => $config['value'], 'description' => $config['description'], 'updated_at' => now()],
            );
        }
    }

    private function seedDummyCustomers(): void
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
            $user = User::firstOrCreate(
                ['mobile' => $data['user']['mobile']],
                array_merge($data['user'], ['password' => bcrypt('password')]),
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

    private function seedDummyDrivers(): void
    {
        $drivers = [
            [
                'user'    => ['mobile' => '+447922234001', 'email' => 'ryan.o\'brien@gmail.com', 'status' => 'active'],
                'profile' => [
                    'first_name' => 'Ryan', 'last_name' => "O'Brien",
                    'vehicle_type' => 'motorcycle', 'vehicle_make' => 'Honda', 'vehicle_model' => 'CBF500',
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
                    'vehicle_type' => 'car', 'vehicle_make' => 'Toyota', 'vehicle_model' => 'Prius',
                    'vehicle_registration' => 'BF20 XKD', 'availability' => 'online', 'approval_status' => 'approved',
                    'current_lat' => '53.48090', 'current_lng' => '-2.23430',
                ],
            ],
            [
                'user'    => ['mobile' => '+447922234004', 'email' => 'aisha.malik@hotmail.co.uk', 'status' => 'pending_approval'],
                'profile' => [
                    'first_name' => 'Aisha', 'last_name' => 'Malik',
                    'vehicle_type' => 'van', 'vehicle_make' => 'Ford', 'vehicle_model' => 'Transit',
                    'vehicle_registration' => 'KY71 TBV', 'availability' => 'offline', 'approval_status' => 'pending',
                    'current_lat' => null, 'current_lng' => null,
                ],
            ],
            [
                'user'    => ['mobile' => '+447922234005', 'email' => 'dan.brooks@gmail.com', 'status' => 'active'],
                'profile' => [
                    'first_name' => 'Dan', 'last_name' => 'Brooks',
                    'vehicle_type' => 'motorcycle', 'vehicle_make' => 'Yamaha', 'vehicle_model' => 'MT-07',
                    'vehicle_registration' => 'SY69 GJR', 'availability' => 'offline', 'approval_status' => 'rejected',
                    'current_lat' => null, 'current_lng' => null,
                ],
            ],
        ];

        foreach ($drivers as $data) {
            $user = User::firstOrCreate(
                ['mobile' => $data['user']['mobile']],
                array_merge($data['user'], ['password' => null]),
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

    private function seedDummyRestaurants(): void
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
            $user = User::firstOrCreate(
                ['email' => $data['user']['email']],
                array_merge($data['user'], ['password' => bcrypt('password'), 'mobile' => $data['user']['mobile']]),
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

    private function seedAdminUser(): void
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
