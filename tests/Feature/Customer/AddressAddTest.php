<?php

namespace Tests\Feature\Customer;

use App\Models\CustomerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AddressAddTest extends TestCase
{
    use RefreshDatabase;

    private function customer(): User
    {
        Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
        $user = User::factory()->create();
        $user->assignRole('customer');
        CustomerProfile::create(['user_id' => $user->id, 'first_name' => 'T', 'last_name' => 'U']);

        return $user;
    }

    public function test_map_flow_saves_a_custom_label_and_makes_it_the_selected_address(): void
    {
        $user = $this->customer();
        // An existing, currently-selected address.
        $old = $user->customerProfile->addresses()->create([
            'label' => 'Home', 'address_line_1' => '1 Old Street', 'city' => 'London', 'county' => 'Greater London',
            'postcode' => 'E1 1AA', 'lat' => 51.5, 'lng' => -0.1, 'is_default' => true, 'is_selected' => true,
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/customer/addresses', [
            'label' => 'school',                 // custom label (previously blocked by in:Home,Work,Other)
            'address_line_1' => '221B Baker Street',
            'address_line_2' => 'Flat 2B',
            'city' => 'London',
            'county' => 'Greater London',
            'postcode' => 'NW1 6XE',
            'delivery_instructions' => 'Ring the top bell.',
            'lat' => 51.5237,
            'lng' => -0.1585,
            'is_selected' => true,
        ])->assertSuccessful();

        $this->assertDatabaseHas('customer_addresses', [
            'label' => 'school',
            'address_line_2' => 'Flat 2B',
            'delivery_instructions' => 'Ring the top bell.',
            'is_selected' => true,
        ]);

        // The previously-selected address is no longer selected.
        $this->assertDatabaseHas('customer_addresses', ['id' => $old->id, 'is_selected' => false]);
    }

    public function test_web_route_accepts_the_same_payload(): void
    {
        $user = $this->customer();
        $this->actingAs($user);

        $this->post('/customer/addresses', [
            'label' => 'gym',
            'address_line_1' => '5 Fitness Way',
            'city' => 'London',
            'county' => 'Greater London',
            'postcode' => 'SW1A 1AA',
            'lat' => 51.5,
            'lng' => -0.12,
            'is_selected' => true,
        ])->assertRedirect();

        $this->assertDatabaseHas('customer_addresses', ['label' => 'gym', 'is_selected' => true]);
    }
}
