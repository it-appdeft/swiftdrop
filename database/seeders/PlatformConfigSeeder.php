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
            ['key' => 'delivery_request_timeout_seconds', 'value' => '30', 'description' => 'Seconds a driver has to accept/reject an incoming delivery request (countdown shown on the request card)'],
            ['key' => 'base_delivery_fee_gbp', 'value' => '1.99', 'description' => 'Base delivery fee in GBP'],
            ['key' => 'delivery_fee_per_mile_gbp', 'value' => '0.80', 'description' => 'Delivery fee added per mile between customer and restaurant'],
            ['key' => 'free_delivery_threshold_gbp', 'value' => '25.00', 'description' => 'Order total above which delivery is free'],
            ['key' => 'order_tax_rate_percent', 'value' => '5.00', 'description' => 'Taxes & charges applied to the item subtotal (%)'],
            ['key' => 'customer_dashboard_radius_miles', 'value' => '5', 'description' => 'Search radius (miles) used when a customer has a default address'],
            ['key' => 'customer_dashboard_fallback_limit', 'value' => '12', 'description' => 'Number of latest restaurants shown when no customer address is set'],
            [
                'key' => 'privacy_policy',
                'value' => '<p>This Privacy Policy describes how SwiftDrop collects, uses, and shares your personal information when you use our website or mobile application.</p><p>At SwiftDrop, we are committed to protecting your privacy and ensuring that your personal data is handled in a safe and responsible manner.</p>',
                'description' => 'Privacy Policy rich-text (HTML) shown in the customer profile and legal API; editable from Platform Settings',
            ],
            [
                'key' => 'terms_and_conditions',
                'value' => '<p>By using SwiftDrop, you agree to be bound by these Terms &amp; Conditions. Please read them carefully before placing an order.</p><p>We may update these terms from time to time. Continued use of the service after changes are posted constitutes acceptance of the new terms.</p>',
                'description' => 'Terms & Conditions rich-text (HTML) shown in the customer profile and legal API; editable from Platform Settings',
            ],
        ];

        foreach ($configs as $config) {
            PlatformConfig::firstOrCreate(
                ['key' => $config['key']],
                ['value' => $config['value'], 'description' => $config['description'], 'updated_at' => now()],
            );
        }
    }
}
