<?php

namespace Tests\Feature\Customer;

use App\Models\CustomerProfile;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ProfileOrdersTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_page_includes_the_customers_past_orders(): void
    {
        Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);

        $customer = User::factory()->create();
        $customer->assignRole('customer');
        CustomerProfile::create(['user_id' => $customer->id, 'first_name' => 'T', 'last_name' => 'U']);

        $restaurant = Restaurant::create([
            'user_id' => User::factory()->create()->id, 'name' => 'The Marble Grill', 'city' => 'London',
            'phone' => '+440000000000', 'status' => 'active', 'approval_status' => 'approved',
        ]);

        $menuItem = MenuItem::create(['restaurant_id' => $restaurant->id, 'name' => 'Margherita Pizza', 'price' => 8.23, 'is_available' => true]);

        $order = Order::create([
            'user_id' => $customer->id, 'restaurant_id' => $restaurant->id, 'status' => 'delivered',
            'subtotal' => 16.25, 'delivery_fee' => 2.20, 'total' => 18.45, 'placed_at' => now(),
        ]);
        $order->items()->create(['menu_item_id' => $menuItem->id, 'name' => 'Margherita Pizza', 'unit_price' => 8.23, 'quantity' => 2, 'subtotal' => 16.46]);

        $this->actingAs($customer)
            ->get('/customer/profile')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('customer/profile', false)
                ->has('orders', 1)
                ->where('orders.0.restaurant', 'The Marble Grill')
                ->where('orders.0.status', 'delivered')
                ->where('orders.0.items.0.name', 'Margherita Pizza')
                ->where('orders.0.items.0.qty', 2),
            );
    }
}
