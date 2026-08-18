<?php

namespace Tests\Feature\Restaurant;

use App\Models\CustomerAddress;
use App\Models\CustomerProfile;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\PlatformConfig;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class OrderAcceptRejectTest extends TestCase
{
    use RefreshDatabase;

    public function test_restaurant_can_accept_a_placed_order(): void
    {
        [$owner, $order] = $this->placedOrder();

        $this->actingAs($owner)
            ->patch("/restaurant/orders/{$order->uuid}/accept")
            ->assertRedirect();

        $order->refresh();
        $this->assertSame('accepted', $order->status->value);
        $this->assertNotNull($order->accepted_at);

        // Accepting opens the order up for driver assignment.
        $this->assertDatabaseHas('deliveries', [
            'order_id' => $order->id, 'status' => 'pending_assignment', 'driver_id' => null,
        ]);

        $this->assertDatabaseHas('order_status_histories', [
            'order_id' => $order->id, 'status' => 'accepted',
        ]);
    }

    public function test_restaurant_can_reject_a_placed_order(): void
    {
        [$owner, $order] = $this->placedOrder();

        $this->actingAs($owner)
            ->patch("/restaurant/orders/{$order->uuid}/reject", ['reason' => 'Out of stock'])
            ->assertRedirect();

        $order->refresh();
        $this->assertSame('rejected', $order->status->value);
        $this->assertSame('restaurant', $order->cancelled_by);
        $this->assertSame('Out of stock', $order->cancellation_reason);
        $this->assertDatabaseMissing('deliveries', ['order_id' => $order->id]);

        $this->assertDatabaseHas('order_status_histories', [
            'order_id' => $order->id, 'status' => 'rejected',
        ]);
    }

    public function test_order_cannot_be_accepted_twice(): void
    {
        [$owner, $order] = $this->placedOrder();
        $order->update(['status' => 'accepted']);

        $this->actingAs($owner)
            ->patch("/restaurant/orders/{$order->uuid}/accept")
            ->assertSessionHasErrors('status');

        $this->assertSame('accepted', $order->fresh()->status->value);
    }

    public function test_accepting_stamps_the_delivery_with_distance_and_eta(): void
    {
        PlatformConfig::create(['key' => 'driver_average_speed_mph', 'value' => '20']);
        PlatformConfig::create(['key' => 'default_prep_time_minutes', 'value' => '15']);

        [$owner, $order] = $this->placedOrder();

        // ~1° of longitude at this latitude is close enough to a round trip
        // distance for the test; the exact figure isn't the point, the eta
        // formula (prep + travel) applied to it is.
        $profile = CustomerProfile::create(['user_id' => $order->customer->id, 'first_name' => 'T', 'last_name' => 'U']);
        $address = CustomerAddress::create([
            'customer_profile_id' => $profile->id, 'label' => 'Home',
            'address_line_1' => '4 Elm St', 'city' => 'London', 'postcode' => 'W1 2AA',
            'lat' => 51.5, 'lng' => 0.0,
        ]);
        $order->update(['address_id' => $address->id]);

        $this->actingAs($owner)->patch("/restaurant/orders/{$order->uuid}/accept")->assertRedirect();

        $expectedDistance = $order->restaurant->distanceMilesFrom(51.5, 0.0);
        $expectedEta = 15 + (int) ceil($expectedDistance / 20 * 60);

        $delivery = $order->delivery()->first();
        $this->assertEquals($expectedDistance, (float) $delivery->distance_miles);
        $this->assertSame($expectedEta, $delivery->eta_minutes);
    }

    public function test_another_restaurants_order_cannot_be_actioned(): void
    {
        [, $order] = $this->placedOrder();

        $strangerOwner = User::factory()->create();
        $strangerOwner->assignRole('restaurant_owner');
        Restaurant::create([
            'user_id' => $strangerOwner->id, 'name' => 'Someone Else', 'city' => 'London',
            'address_line_1' => '2 High St', 'postcode' => 'W1 1AB', 'lat' => 51.5, 'lng' => -0.1,
            'phone' => '+440000000001', 'status' => 'active', 'approval_status' => 'approved',
            'application_submitted_at' => now(),
        ]);

        $this->actingAs($strangerOwner)
            ->patch("/restaurant/orders/{$order->uuid}/accept")
            ->assertSessionHasErrors('order');

        $this->assertSame('placed', $order->fresh()->status->value);
    }

    /** @return array{0: User, 1: Order} */
    private function placedOrder(): array
    {
        Role::firstOrCreate(['name' => 'restaurant_owner', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);

        $owner = User::factory()->create();
        $owner->assignRole('restaurant_owner');

        $restaurant = Restaurant::create([
            'user_id' => $owner->id, 'name' => 'The Marble Grill', 'city' => 'London',
            'address_line_1' => '1 High St', 'postcode' => 'W1 1AA', 'lat' => 51.5, 'lng' => -0.1,
            'phone' => '+440000000000', 'status' => 'active', 'approval_status' => 'approved',
            'application_submitted_at' => now(),
        ]);

        $menuItem = MenuItem::create(['restaurant_id' => $restaurant->id, 'name' => 'Margherita Pizza', 'price' => 8.23, 'is_available' => true]);

        $customer = User::factory()->create();
        $customer->assignRole('customer');

        $order = Order::create([
            'user_id' => $customer->id, 'restaurant_id' => $restaurant->id, 'status' => 'placed',
            'subtotal' => 8.23, 'delivery_fee' => 1.99, 'total' => 10.22, 'placed_at' => now(),
        ]);
        $order->items()->create(['menu_item_id' => $menuItem->id, 'name' => 'Margherita Pizza', 'unit_price' => 8.23, 'quantity' => 1, 'subtotal' => 8.23]);
        $order->statusHistories()->create(['status' => 'placed', 'updated_by' => $customer->id]);

        return [$owner, $order];
    }
}
