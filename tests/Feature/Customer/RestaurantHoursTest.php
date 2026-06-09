<?php

namespace Tests\Feature\Customer;

use App\Models\CustomerProfile;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Customer responses must expose `is_accepting_orders` plus today's open/close
 * window and a live `is_open_now` flag (driven by {@see Restaurant::isOpenNow()}),
 * so the web can gray out paused restaurants and show an hours status line.
 */
class RestaurantHoursTest extends TestCase
{
    use RefreshDatabase;

    private const LAT = 51.5074;

    private const LNG = -0.1278;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function restaurant(bool $accepting = true): Restaurant
    {
        return Restaurant::create([
            'user_id' => User::factory()->create()->id,
            'name' => 'Hours Co',
            'phone' => '+44'.fake()->numerify('##########'),
            'status' => 'active',
            'approval_status' => 'approved',
            'is_accepting_orders' => $accepting,
            'rating' => 4.5,
            'lat' => self::LAT,
            'lng' => self::LNG,
        ]);
    }

    private function setHours(Restaurant $r, string $from, string $to, bool $isOpen = true): void
    {
        $today = strtolower(Carbon::now()->format('D'));
        $r->hours()->create(['day_of_week' => $today, 'is_open' => $isOpen, 'open_from' => $from, 'open_to' => $to]);
    }

    public function test_is_open_now_inside_window(): void
    {
        Carbon::setTestNow('2026-06-10 12:00:00');
        $r = $this->restaurant();
        $this->setHours($r, '09:00:00', '23:00:00');

        $this->assertTrue($r->fresh()->isOpenNow());
    }

    public function test_is_open_now_outside_window(): void
    {
        Carbon::setTestNow('2026-06-10 06:00:00');
        $r = $this->restaurant();
        $this->setHours($r, '09:00:00', '23:00:00');

        $this->assertFalse($r->fresh()->isOpenNow());
    }

    public function test_is_open_now_marked_closed_today(): void
    {
        Carbon::setTestNow('2026-06-10 12:00:00');
        $r = $this->restaurant();
        $this->setHours($r, '09:00:00', '23:00:00', isOpen: false);

        $this->assertFalse($r->fresh()->isOpenNow());
    }

    public function test_is_open_now_no_hours_row_is_closed(): void
    {
        Carbon::setTestNow('2026-06-10 12:00:00');
        $r = $this->restaurant();

        $this->assertFalse($r->fresh()->isOpenNow());
    }

    public function test_is_open_now_overnight_window(): void
    {
        $r = $this->restaurant();

        // 18:00 → 02:00 spans midnight: open at 19:00 and 01:00, closed at noon.
        Carbon::setTestNow('2026-06-10 19:00:00');
        $this->setHours($r, '18:00:00', '02:00:00');
        $this->assertTrue($r->fresh()->isOpenNow());

        Carbon::setTestNow('2026-06-10 01:00:00');
        $this->assertTrue($r->fresh()->isOpenNow());

        Carbon::setTestNow('2026-06-10 12:00:00');
        $this->assertFalse($r->fresh()->isOpenNow());
    }

    private function actingCustomer(): User
    {
        Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
        $customer = User::factory()->create();
        $customer->assignRole('customer');
        CustomerProfile::create(['user_id' => $customer->id, 'first_name' => 'T', 'last_name' => 'U']);
        Sanctum::actingAs($customer);

        return $customer;
    }

    public function test_api_restaurant_list_exposes_accepting_and_today_hours(): void
    {
        Carbon::setTestNow('2026-06-10 12:00:00');
        $this->actingCustomer();

        $r = $this->restaurant(accepting: false);
        $this->setHours($r, '09:00:00', '23:00:00');

        $row = $this->getJson('/api/customer/restaurants?latitude='.self::LAT.'&longitude='.self::LNG)
            ->assertOk()
            ->json('data.restaurants.0');

        $this->assertFalse($row['is_accepting_orders']);
        $this->assertTrue($row['is_open_now']);
        $this->assertSame(['is_open' => true, 'open_from' => '09:00', 'open_to' => '23:00'], $row['today_hours']);
    }

    public function test_top_picks_include_paused_restaurant_with_accepting_status(): void
    {
        Carbon::setTestNow('2026-06-10 12:00:00');
        $this->actingCustomer();

        // Paused (not accepting) but live, approved and well-rated → it must
        // still surface in Top Picks so the card can gray it out.
        $r = $this->restaurant(accepting: false);
        $this->setHours($r, '09:00:00', '23:00:00');

        $row = $this->getJson('/api/customer/top-picks?latitude='.self::LAT.'&longitude='.self::LNG)
            ->assertOk()
            ->json('data.0');

        $this->assertSame($r->id, $row['id']);
        $this->assertFalse($row['is_accepting_orders']);
    }
}
