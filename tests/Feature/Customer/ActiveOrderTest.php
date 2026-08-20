<?php

namespace Tests\Feature\Customer;

use App\Models\CustomerProfile;
use App\Models\Delivery;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ActiveOrderTest extends TestCase
{
    use RefreshDatabase;

    public function test_no_active_orders_returns_an_empty_list(): void
    {
        $customer = $this->customer();

        $this->actingAs($customer)
            ->getJson('/api/customer/orders/active')
            ->assertOk()
            ->assertJsonPath('data', []);
    }

    public function test_an_unaccepted_order_has_no_eta(): void
    {
        $customer = $this->customer();
        $this->order($customer, status: 'placed');

        $this->actingAs($customer)
            ->getJson('/api/customer/orders/active')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.is_accepted', false)
            ->assertJsonPath('data.0.eta_minutes', null);
    }

    public function test_an_accepted_order_counts_down_its_stamped_eta(): void
    {
        Carbon::setTestNow('2026-08-18 12:00:00');
        $customer = $this->customer();
        $order = $this->order($customer, status: 'accepted', acceptedAt: Carbon::parse('2026-08-18 11:55:00'));
        Delivery::create(['order_id' => $order->id, 'status' => 'pending_assignment', 'eta_minutes' => 20]);

        $this->actingAs($customer)
            ->getJson('/api/customer/orders/active')
            ->assertOk()
            ->assertJsonPath('data.0.is_accepted', true)
            // 20 stamped minutes minus exactly 5 elapsed.
            ->assertJsonPath('data.0.eta_minutes', 15);

        Carbon::setTestNow();
    }

    public function test_eta_never_goes_negative(): void
    {
        Carbon::setTestNow('2026-08-18 12:00:00');
        $customer = $this->customer();
        $order = $this->order($customer, status: 'out_for_delivery', acceptedAt: Carbon::parse('2026-08-18 11:15:00'));
        Delivery::create(['order_id' => $order->id, 'status' => 'assigned', 'eta_minutes' => 20]);

        $this->actingAs($customer)
            ->getJson('/api/customer/orders/active')
            ->assertOk()
            ->assertJsonPath('data.0.eta_minutes', 0);

        Carbon::setTestNow();
    }

    public function test_delivered_and_cancelled_orders_are_excluded(): void
    {
        $customer = $this->customer();
        $this->order($customer, status: 'delivered');
        $this->order($customer, status: 'cancelled');
        $this->order($customer, status: 'rejected');

        $this->actingAs($customer)
            ->getJson('/api/customer/orders/active')
            ->assertOk()
            ->assertJsonPath('data', []);
    }

    public function test_another_customers_orders_are_not_included(): void
    {
        $stranger = $this->customer();
        $this->order($stranger, status: 'placed');

        $customer = $this->customer();

        $this->actingAs($customer)
            ->getJson('/api/customer/orders/active')
            ->assertOk()
            ->assertJsonPath('data', []);
    }

    private function customer(): User
    {
        Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
        $user = User::factory()->create();
        $user->assignRole('customer');
        CustomerProfile::create(['user_id' => $user->id, 'first_name' => 'T', 'last_name' => 'U']);

        return $user;
    }

    private function order(User $customer, string $status, ?Carbon $acceptedAt = null): Order
    {
        $restaurant = Restaurant::create([
            'user_id' => User::factory()->create()->id, 'name' => 'The Marble Grill', 'city' => 'London',
            'address_line_1' => '1 High St', 'postcode' => 'W1 1AA', 'lat' => 51.5, 'lng' => -0.1,
            'phone' => '+440000000000', 'status' => 'active', 'approval_status' => 'approved',
        ]);
        $menuItem = MenuItem::create(['restaurant_id' => $restaurant->id, 'name' => 'Margherita Pizza', 'price' => 8.23, 'is_available' => true]);

        $order = Order::create([
            'user_id' => $customer->id, 'restaurant_id' => $restaurant->id, 'status' => $status,
            'subtotal' => 8.23, 'delivery_fee' => 1.99, 'total' => 10.22, 'placed_at' => now(),
            'accepted_at' => $acceptedAt,
        ]);
        $order->items()->create(['menu_item_id' => $menuItem->id, 'name' => 'Margherita Pizza', 'unit_price' => 8.23, 'quantity' => 1, 'subtotal' => 8.23]);

        return $order;
    }
}
