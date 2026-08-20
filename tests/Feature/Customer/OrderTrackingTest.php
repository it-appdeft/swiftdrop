<?php

namespace Tests\Feature\Customer;

use App\Contracts\Driver\DriverDashboardServiceInterface;
use App\Models\CustomerProfile;
use App\Models\Delivery;
use App\Models\DriverProfile;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class OrderTrackingTest extends TestCase
{
    use RefreshDatabase;

    public function test_status_endpoint_returns_the_owned_order(): void
    {
        [$customer, $order] = $this->placedOrder();

        $this->actingAs($customer)
            ->getJson("/api/customer/orders/{$order->uuid}/status")
            ->assertOk()
            ->assertJsonPath('data.order.uuid', $order->uuid)
            ->assertJsonPath('data.order.status', 'placed')
            ->assertJsonPath('data.order.cancellable', true);
    }

    public function test_status_endpoint_404s_for_another_customers_order(): void
    {
        [, $order] = $this->placedOrder();
        $stranger = User::factory()->create();
        $stranger->assignRole('customer');

        $this->actingAs($stranger)
            ->getJson("/api/customer/orders/{$order->uuid}/status")
            ->assertNotFound();
    }

    public function test_customer_can_cancel_a_placed_order(): void
    {
        [$customer, $order] = $this->placedOrder();

        $this->actingAs($customer)
            ->postJson("/api/customer/orders/{$order->uuid}/cancel", ['reason' => 'Ordered by mistake'])
            ->assertOk()
            ->assertJsonPath('data.order.status', 'cancelled')
            ->assertJsonPath('data.order.cancellable', false);

        $order->refresh();
        $this->assertSame('cancelled', $order->status->value);
        $this->assertSame('customer', $order->cancelled_by);
        $this->assertSame('Ordered by mistake', $order->cancellation_reason);
        $this->assertNotNull($order->cancelled_at);

        $this->assertDatabaseHas('order_status_histories', [
            'order_id' => $order->id,
            'status' => 'cancelled',
            'updated_by' => $customer->id,
        ]);
    }

    public function test_order_cannot_be_cancelled_once_no_longer_placed(): void
    {
        [$customer, $order] = $this->placedOrder();
        $order->update(['status' => 'preparing']);

        $this->actingAs($customer)
            ->postJson("/api/customer/orders/{$order->uuid}/cancel", ['reason' => 'Too late'])
            ->assertStatus(422);

        $this->assertSame('preparing', $order->fresh()->status->value);
    }

    public function test_driver_accepting_the_delivery_stamps_a_delivery_code(): void
    {
        [, $order] = $this->placedOrder();

        $driverUser = User::factory()->create();
        Role::firstOrCreate(['name' => 'driver', 'guard_name' => 'web']);
        $driverUser->assignRole('driver');

        $driverProfile = DriverProfile::create([
            'user_id' => $driverUser->id,
            'first_name' => 'James',
            'last_name' => 'Bride',
            'vehicle_type' => 'car',
            'vehicle_registration' => 'AB12CDE',
            'availability' => 'online',
            'approval_status' => 'approved',
            // Within the assignment radius of the restaurant (lat 51.5, lng -0.1
            // in placedOrder() below) — see DriverDashboardService::acceptDelivery().
            'current_lat' => 51.5,
            'current_lng' => -0.1,
        ]);

        $delivery = Delivery::create([
            'order_id' => $order->id,
            'status' => 'pending_assignment',
        ]);

        app(DriverDashboardServiceInterface::class)->respondToDelivery($driverUser, $delivery->id, 'accept');

        $order->refresh();
        $this->assertMatchesRegularExpression('/^\d{4}$/', $order->delivery_code);
        $this->assertSame('out_for_delivery', $order->status->value);

        $this->assertDatabaseHas('order_status_histories', [
            'order_id' => $order->id,
            'status' => 'out_for_delivery',
        ]);
    }

    /** @return array{0: User, 1: Order} */
    private function placedOrder(): array
    {
        Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);

        $customer = User::factory()->create();
        $customer->assignRole('customer');
        CustomerProfile::create(['user_id' => $customer->id, 'first_name' => 'T', 'last_name' => 'U']);

        $restaurant = Restaurant::create([
            'user_id' => User::factory()->create()->id, 'name' => 'The Marble Grill', 'city' => 'London',
            'address_line_1' => '1 High St', 'postcode' => 'W1 1AA', 'lat' => 51.5, 'lng' => -0.1,
            'phone' => '+440000000000', 'status' => 'active', 'approval_status' => 'approved',
        ]);

        $menuItem = MenuItem::create(['restaurant_id' => $restaurant->id, 'name' => 'Margherita Pizza', 'price' => 8.23, 'is_available' => true]);

        $order = Order::create([
            'user_id' => $customer->id, 'restaurant_id' => $restaurant->id, 'status' => 'placed',
            'subtotal' => 8.23, 'delivery_fee' => 1.99, 'total' => 10.22, 'placed_at' => now(),
        ]);
        $order->items()->create(['menu_item_id' => $menuItem->id, 'name' => 'Margherita Pizza', 'unit_price' => 8.23, 'quantity' => 1, 'subtotal' => 8.23]);
        $order->statusHistories()->create(['status' => 'placed', 'updated_by' => $customer->id]);

        return [$customer, $order];
    }
}
