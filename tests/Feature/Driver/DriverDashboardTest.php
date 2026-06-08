<?php

namespace Tests\Feature\Driver;

use App\Models\Delivery;
use App\Models\DriverEarning;
use App\Models\DriverProfile;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DriverDashboardTest extends TestCase
{
    use RefreshDatabase;

    /** An approved, fully set-up driver (offline by default). */
    private function driver(array $overrides = []): DriverProfile
    {
        $user = User::factory()->create();

        return DriverProfile::create(array_merge([
            'user_id' => $user->id,
            'first_name' => 'Dave',
            'last_name' => 'Rider',
            'vehicle_type' => 'car',
            'vehicle_registration' => 'AB12 CDE',
            'availability' => 'offline',
            'approval_status' => 'approved',
            'setup_step' => DriverProfile::SETUP_STEP_DOCUMENTS,
        ], $overrides));
    }

    /** A delivery sitting in the pool (or assigned, via overrides). */
    private function delivery(array $overrides = []): Delivery
    {
        $restaurant = Restaurant::create([
            'user_id' => User::factory()->create()->id,
            'name' => 'Urban Grind', 'phone' => '+441234567890',
            'address_line_1' => '742 Evergreen Terrace', 'city' => 'London', 'postcode' => 'AB1 1AA',
            'lat' => 51.5, 'lng' => -0.12, 'status' => 'active', 'approval_status' => 'approved',
        ]);

        $order = Order::create([
            'user_id' => User::factory()->create()->id,
            'restaurant_id' => $restaurant->id,
            'status' => 'ready_for_pickup',
            'subtotal' => 14, 'delivery_fee' => 2, 'total' => 16, 'placed_at' => now(),
        ]);

        return Delivery::create(array_merge([
            'order_id' => $order->id,
            'status' => 'pending_assignment',
            'eta_minutes' => 24,
            'distance_miles' => 4.2,
        ], $overrides));
    }

    public function test_dashboard_reports_status_earnings_and_timeout(): void
    {
        $driver = $this->driver();

        DriverEarning::create([
            'driver_id' => $driver->id, 'type' => 'delivery_fee', 'amount' => 16.00,
            'status' => 'paid', 'earned_at' => now(),
        ]);
        // An earning from yesterday must NOT count towards today.
        DriverEarning::create([
            'driver_id' => $driver->id, 'type' => 'delivery_fee', 'amount' => 99.00,
            'status' => 'paid', 'earned_at' => now()->subDay(),
        ]);

        Sanctum::actingAs($driver->user);

        $response = $this->getJson('/api/driver/dashboard')
            ->assertOk()
            ->assertJsonPath('data.availability', 'offline')
            ->assertJsonPath('data.approval_status', 'approved')
            ->assertJsonPath('data.is_setup_complete', true)
            ->assertJsonPath('data.deliveries_today', 0);

        $this->assertEquals(16.0, $response->json('data.earnings.today'));
        // Falls back to the service default (30s) when nothing is configured.
        $this->assertEquals(30, $response->json('data.delivery_request_timeout_seconds'));
    }

    public function test_online_driver_sees_pending_delivery_requests(): void
    {
        $driver = $this->driver(['availability' => 'online']);
        $delivery = $this->delivery();
        Sanctum::actingAs($driver->user);

        $this->getJson('/api/driver/delivery-requests')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $delivery->id)
            ->assertJsonPath('data.0.amount', 16)
            ->assertJsonPath('data.0.eta_minutes', 24)
            ->assertJsonPath('data.0.pickup.name', 'Urban Grind');
    }

    public function test_offline_driver_sees_no_delivery_requests(): void
    {
        $driver = $this->driver(['availability' => 'offline']);
        $this->delivery();
        Sanctum::actingAs($driver->user);

        $this->getJson('/api/driver/delivery-requests')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_assigned_deliveries_are_excluded_from_the_pool(): void
    {
        $taker = $this->driver();
        $this->delivery(['driver_id' => $taker->id, 'status' => 'assigned']);

        $driver = $this->driver(['availability' => 'online']);
        Sanctum::actingAs($driver->user);

        $this->getJson('/api/driver/delivery-requests')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_approved_driver_can_go_online(): void
    {
        $driver = $this->driver();
        Sanctum::actingAs($driver->user);

        $this->postJson('/api/driver/availability', ['availability' => 'online'])
            ->assertOk()
            ->assertJsonPath('data.is_online', true);

        $driver->refresh();
        $this->assertSame('online', $driver->availability);
        $this->assertNotNull($driver->online_since);
    }

    public function test_unapproved_driver_cannot_go_online(): void
    {
        $driver = $this->driver(['approval_status' => 'pending']);
        Sanctum::actingAs($driver->user);

        $this->postJson('/api/driver/availability', ['availability' => 'online'])
            ->assertStatus(422);

        $this->assertSame('offline', $driver->fresh()->availability);
    }

    public function test_update_location_persists_to_profile(): void
    {
        $driver = $this->driver();
        Sanctum::actingAs($driver->user);

        $this->postJson('/api/driver/location', ['lat' => 51.51234567, 'lng' => -0.09876543])
            ->assertOk();

        $driver->refresh();
        $this->assertEquals(51.51234567, (float) $driver->current_lat);
        $this->assertEquals(-0.09876543, (float) $driver->current_lng);
    }

    public function test_driver_can_accept_an_offered_delivery(): void
    {
        $driver = $this->driver();
        $delivery = $this->delivery();
        Sanctum::actingAs($driver->user);

        $this->postJson("/api/driver/deliveries/{$delivery->id}/respond", ['action' => 'accept'])
            ->assertOk()
            ->assertJsonPath('data.status', 'assigned')
            ->assertJsonPath('data.driver_id', $driver->id);

        $this->assertDatabaseHas('deliveries', [
            'id' => $delivery->id, 'driver_id' => $driver->id, 'status' => 'assigned',
        ]);
    }

    public function test_cannot_accept_a_delivery_already_taken(): void
    {
        $other = $this->driver();
        $delivery = $this->delivery(['driver_id' => $other->id, 'status' => 'assigned']);

        $driver = $this->driver();
        Sanctum::actingAs($driver->user);

        $this->postJson("/api/driver/deliveries/{$delivery->id}/respond", ['action' => 'accept'])
            ->assertStatus(422);

        $this->assertDatabaseHas('deliveries', ['id' => $delivery->id, 'driver_id' => $other->id]);
    }

    public function test_rejecting_releases_the_delivery_and_counts_the_attempt(): void
    {
        $driver = $this->driver();
        $delivery = $this->delivery();
        Sanctum::actingAs($driver->user);

        $this->postJson("/api/driver/deliveries/{$delivery->id}/respond", ['action' => 'reject'])
            ->assertOk()
            ->assertJsonPath('data.status', 'pending_assignment');

        $this->assertDatabaseHas('deliveries', [
            'id' => $delivery->id, 'driver_id' => null,
            'status' => 'pending_assignment', 'assignment_attempts' => 1,
        ]);
    }
}
