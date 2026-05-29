<?php

namespace Tests\Feature\Customer;

use App\Models\CustomerAddress;
use App\Models\CustomerProfile;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AddressDeletionTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{customer: User, address: CustomerAddress, restaurant: Restaurant} */
    private function graph(): array
    {
        Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);

        $customer = User::factory()->create();
        $customer->assignRole('customer');
        $profile = CustomerProfile::create(['user_id' => $customer->id, 'first_name' => 'T', 'last_name' => 'U']);
        $address = $profile->addresses()->create([
            'label' => 'Home', 'address_line_1' => '1 St', 'city' => 'London', 'postcode' => 'AB1 1AA',
            'lat' => 51.5, 'lng' => -0.12, 'is_default' => true, 'is_selected' => true,
        ]);

        $restaurant = Restaurant::create([
            'user_id' => User::factory()->create()->id, 'name' => 'R', 'phone' => '+440000000000',
            'status' => 'active', 'approval_status' => 'approved',
        ]);

        return compact('customer', 'address', 'restaurant');
    }

    private function orderWith(User $customer, Restaurant $restaurant, CustomerAddress $address, string $status): Order
    {
        return Order::create([
            'user_id' => $customer->id, 'restaurant_id' => $restaurant->id, 'address_id' => $address->id,
            'status' => $status, 'subtotal' => 10, 'delivery_fee' => 0, 'total' => 10, 'placed_at' => now(),
        ]);
    }

    public function test_cannot_delete_address_with_an_active_order(): void
    {
        ['customer' => $customer, 'address' => $address, 'restaurant' => $restaurant] = $this->graph();
        $this->orderWith($customer, $restaurant, $address, 'preparing');
        Sanctum::actingAs($customer);

        $this->deleteJson("/api/customer/addresses/{$address->id}")
            ->assertStatus(422)
            ->assertJsonValidationErrors('address');

        $this->assertDatabaseHas('customer_addresses', ['id' => $address->id]);
    }

    public function test_can_delete_address_when_orders_are_delivered_or_cancelled(): void
    {
        ['customer' => $customer, 'address' => $address, 'restaurant' => $restaurant] = $this->graph();
        $delivered = $this->orderWith($customer, $restaurant, $address, 'delivered');
        $this->orderWith($customer, $restaurant, $address, 'cancelled');
        Sanctum::actingAs($customer);

        $this->deleteJson("/api/customer/addresses/{$address->id}")->assertOk();

        $this->assertDatabaseMissing('customer_addresses', ['id' => $address->id]);
        // The delivered order survives; its address link nulls out via the FK.
        $this->assertDatabaseHas('orders', ['id' => $delivered->id, 'address_id' => null]);
    }

    public function test_can_delete_address_with_no_orders(): void
    {
        ['customer' => $customer, 'address' => $address] = $this->graph();
        Sanctum::actingAs($customer);

        $this->deleteJson("/api/customer/addresses/{$address->id}")->assertOk();
        $this->assertDatabaseMissing('customer_addresses', ['id' => $address->id]);
    }
}
