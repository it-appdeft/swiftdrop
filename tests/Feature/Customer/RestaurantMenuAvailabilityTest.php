<?php

namespace Tests\Feature\Customer;

use App\Models\MenuItem;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RestaurantMenuAvailabilityTest extends TestCase
{
    use RefreshDatabase;

    private function customer(): User
    {
        Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        return $customer;
    }

    private function restaurant(): Restaurant
    {
        return Restaurant::create([
            'user_id' => User::factory()->create()->id,
            'name' => 'Test Pizzeria',
            'phone' => '+441234567890',
            'status' => 'active',
            'approval_status' => 'approved',
        ]);
    }

    public function test_detail_page_lists_unavailable_dishes_flagged_and_after_available_ones(): void
    {
        $customer = $this->customer();
        $restaurant = $this->restaurant();

        MenuItem::create(['restaurant_id' => $restaurant->id, 'name' => 'Live Pizza', 'price' => 10, 'is_available' => true, 'sort_order' => 0]);
        // Off-menu dish must still appear (grayed, no Add button on the frontend),
        // sorted after available ones, carrying the is_available flag.
        MenuItem::create(['restaurant_id' => $restaurant->id, 'name' => 'Sold Out Pizza', 'price' => 12, 'is_available' => false, 'sort_order' => 1]);

        Sanctum::actingAs($customer);

        $this->getJson("/api/customer/restaurants/{$restaurant->id}")
            ->assertOk()
            ->assertJsonPath('data.categories.0.items.0.name', 'Live Pizza')
            ->assertJsonPath('data.categories.0.items.0.is_available', true)
            ->assertJsonPath('data.categories.0.items.1.name', 'Sold Out Pizza')
            ->assertJsonPath('data.categories.0.items.1.is_available', false);
    }
}
