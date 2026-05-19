<?php

namespace Database\Seeders;

use App\Enums\UserRoleEnum;
use App\Models\DeletionReason;
use Illuminate\Database\Seeder;

class DeletionReasonSeeder extends Seeder
{
    public function run(): void
    {
        $reasonsByRole = [
            UserRoleEnum::CUSTOMER->value => [
                ['slug' => 'not_using_anymore', 'label' => "I don't want to use Swiftdrop anymore"],
                ['slug' => 'different_account', 'label' => "I'm using a different account"],
                ['slug' => 'privacy_concern', 'label' => "I'm worried about my privacy"],
                ['slug' => 'too_many_notifications', 'label' => "You're sending me too many emails/notification"],
                ['slug' => 'app_not_working', 'label' => 'The app is not working properly'],
                ['slug' => DeletionReason::SLUG_OTHER, 'label' => 'Other'],
            ],
            UserRoleEnum::DRIVER->value => [
                ['slug' => 'not_enough_orders', 'label' => 'Not enough delivery orders'],
                ['slug' => 'low_earnings', 'label' => 'Earnings are too low'],
                ['slug' => 'privacy_concern', 'label' => "I'm worried about my privacy"],
                ['slug' => 'switching_platforms', 'label' => 'Switching to a different platform'],
                ['slug' => 'app_not_working', 'label' => 'The app is not working properly'],
                ['slug' => DeletionReason::SLUG_OTHER, 'label' => 'Other'],
            ],
            UserRoleEnum::RESTAURANT_OWNER->value => [
                ['slug' => 'low_order_volume', 'label' => 'Order volume is too low'],
                ['slug' => 'commission_too_high', 'label' => 'Commission rate is too high'],
                ['slug' => 'closing_business', 'label' => 'Closing the business'],
                ['slug' => 'switching_platforms', 'label' => 'Switching to a different platform'],
                ['slug' => 'app_not_working', 'label' => 'The app is not working properly'],
                ['slug' => DeletionReason::SLUG_OTHER, 'label' => 'Other'],
            ],
        ];

        foreach ($reasonsByRole as $role => $reasons) {
            foreach ($reasons as $index => $reason) {
                DeletionReason::updateOrCreate(
                    ['role' => $role, 'slug' => $reason['slug']],
                    [
                        'label' => $reason['label'],
                        'is_active' => true,
                        'sort_order' => $index + 1,
                    ],
                );
            }
        }
    }
}
