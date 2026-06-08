<?php

namespace Tests\Feature\Customer;

use App\Models\CustomerProfile;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * The API resolves restaurant discovery / Top Picks distance from the
 * frontend-provided latitude/longitude, NOT the customer's saved address
 * (which still backs the web). Missing coordinates degrade to a valid,
 * null-distance response rather than falling back to the saved address.
 *
 * Behaviour is asserted on the per-row `distance_miles` (the origin of the
 * Haversine calc) rather than radius filtering, so it holds across DB drivers.
 */
class RestaurantDiscoveryLocationTest extends TestCase
{
    use RefreshDatabase;

    // London selected address — used to prove the API does NOT read it.
    private const LONDON = ['lat' => 51.5074, 'lng' => -0.1278];

    // Paris — what the frontend sends; ~213 miles from London so the computed
    // distance unambiguously reveals which origin each surface used.
    private const PARIS = ['lat' => 48.8566, 'lng' => 2.3522];

    /** @return array{customer: User, london: Restaurant, paris: Restaurant} */
    private function graph(): array
    {
        Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);

        $customer = User::factory()->create();
        $customer->assignRole('customer');
        $profile = CustomerProfile::create(['user_id' => $customer->id, 'first_name' => 'T', 'last_name' => 'U']);
        $profile->addresses()->create([
            'label' => 'Home', 'address_line_1' => '1 St', 'city' => 'London', 'postcode' => 'AB1 1AA',
            'lat' => self::LONDON['lat'], 'lng' => self::LONDON['lng'],
            'is_default' => true, 'is_selected' => true,
        ]);

        $london = $this->restaurant('London Bites', self::LONDON);
        $paris = $this->restaurant('Paris Bistro', self::PARIS);

        return compact('customer', 'london', 'paris');
    }

    private function restaurant(string $name, array $coords): Restaurant
    {
        return Restaurant::create([
            'user_id' => User::factory()->create()->id,
            'name' => $name,
            'phone' => '+44'.fake()->numerify('##########'),
            'status' => 'active',
            'approval_status' => 'approved',
            'is_accepting_orders' => true,
            'rating' => 4.8,
            'lat' => $coords['lat'],
            'lng' => $coords['lng'],
        ]);
    }

    /** Pull the {id => distance_miles} map out of a list response. */
    private function distancesById(array $rows): array
    {
        return collect($rows)->mapWithKeys(fn ($r) => [$r['id'] => $r['distance_miles']])->all();
    }

    public function test_api_restaurants_measure_distance_from_frontend_coordinates(): void
    {
        ['customer' => $customer, 'london' => $london, 'paris' => $paris] = $this->graph();
        Sanctum::actingAs($customer);

        // Frontend sends Paris → distances are measured from Paris, not the
        // saved London address: the Paris restaurant sits at ~0 miles.
        $rows = $this->getJson('/api/customer/restaurants?latitude='.self::PARIS['lat'].'&longitude='.self::PARIS['lng'])
            ->assertOk()
            ->json('data.restaurants');

        $byId = $this->distancesById($rows);
        $this->assertEqualsWithDelta(0, $byId[$paris->id], 0.5);
        $this->assertEqualsWithDelta(213, $byId[$london->id], 5);
    }

    public function test_api_restaurants_without_coordinates_ignore_saved_address(): void
    {
        ['customer' => $customer] = $this->graph();
        Sanctum::actingAs($customer);

        // No lat/lng → the saved London address is NOT used. Both restaurants
        // come back with null distances and no error.
        $rows = $this->getJson('/api/customer/restaurants')
            ->assertOk()
            ->json('data.restaurants');

        $this->assertCount(2, $rows);
        foreach ($rows as $row) {
            $this->assertNull($row['distance_miles']);
        }
    }

    public function test_api_top_picks_measure_distance_from_frontend_coordinates(): void
    {
        ['customer' => $customer, 'paris' => $paris] = $this->graph();
        Sanctum::actingAs($customer);

        $rows = $this->getJson('/api/customer/top-picks?latitude='.self::PARIS['lat'].'&longitude='.self::PARIS['lng'])
            ->assertOk()
            ->json('data');

        $this->assertEqualsWithDelta(0, $this->distancesById($rows)[$paris->id], 0.5);
    }

    public function test_api_top_picks_without_coordinates_null_distances(): void
    {
        ['customer' => $customer] = $this->graph();
        Sanctum::actingAs($customer);

        $rows = $this->getJson('/api/customer/top-picks')
            ->assertOk()
            ->json('data');

        foreach ($rows as $row) {
            $this->assertNull($row['distance_miles']);
        }
    }

    public function test_api_rejects_out_of_range_coordinates(): void
    {
        ['customer' => $customer] = $this->graph();
        Sanctum::actingAs($customer);

        $this->getJson('/api/customer/restaurants?latitude=999&longitude=2.35')
            ->assertStatus(422)
            ->assertJsonValidationErrors('latitude');
    }

    public function test_api_search_measures_distance_from_frontend_coordinates(): void
    {
        ['customer' => $customer, 'london' => $london, 'paris' => $paris] = $this->graph();
        Sanctum::actingAs($customer);

        // "Bi" matches both "London Bites" and "Paris Bistro" by name.
        $rows = $this->getJson('/api/customer/search/restaurant?search=Bi&latitude='.self::PARIS['lat'].'&longitude='.self::PARIS['lng'])
            ->assertOk()
            ->json('data.results');

        $byId = $this->distancesById($rows);
        $this->assertEqualsWithDelta(0, $byId[$paris->id], 0.5);
        $this->assertEqualsWithDelta(213, $byId[$london->id], 5);
    }

    public function test_api_search_without_coordinates_ignores_saved_address(): void
    {
        ['customer' => $customer] = $this->graph();
        Sanctum::actingAs($customer);

        $rows = $this->getJson('/api/customer/search/restaurant?search=Bi')
            ->assertOk()
            ->json('data.results');

        $this->assertCount(2, $rows);
        foreach ($rows as $row) {
            $this->assertNull($row['distance_miles']);
        }
    }

    public function test_web_search_still_measures_distance_from_selected_address(): void
    {
        ['customer' => $customer, 'london' => $london, 'paris' => $paris] = $this->graph();

        $rows = $this->actingAs($customer)
            ->getJson('/customer/search/restaurant?search=Bi')
            ->assertOk()
            ->json('restaurants');

        $byId = $this->distancesById($rows);
        $this->assertEqualsWithDelta(0, $byId[$london->id], 0.5);
        $this->assertEqualsWithDelta(213, $byId[$paris->id], 5);
    }

    public function test_web_restaurants_still_measure_distance_from_selected_address(): void
    {
        ['customer' => $customer, 'london' => $london, 'paris' => $paris] = $this->graph();

        // Web is unchanged: distance is measured from the saved London address,
        // so the London restaurant sits at ~0 miles — no lat/lng is read.
        $rows = $this->actingAs($customer)
            ->getJson('/customer/restaurants')
            ->assertOk()
            ->json('restaurants');

        $byId = $this->distancesById($rows);
        $this->assertEqualsWithDelta(0, $byId[$london->id], 0.5);
        $this->assertEqualsWithDelta(213, $byId[$paris->id], 5);
    }
}
