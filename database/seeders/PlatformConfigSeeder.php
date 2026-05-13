<?php

namespace Database\Seeders;

use App\Models\PlatformConfig;
use Illuminate\Database\Seeder;

class PlatformConfigSeeder extends Seeder
{
    public function run(): void
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
}
