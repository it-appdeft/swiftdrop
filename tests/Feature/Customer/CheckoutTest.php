<?php

namespace Tests\Feature\Customer;

use App\Models\Cart;
use App\Models\CustomerAddress;
use App\Models\CustomerProfile;
use App\Models\MenuItem;
use App\Models\Offer;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    private float $rLat = 51.50000000;
    private float $rLng = -0.12000000;

    /**
     * Customer with a near (in-range) + far (out-of-range) address and a cart
     * holding one £5 item × 2 from a restaurant at a fixed coordinate.
     *
     * @return array{customer: User, restaurant: Restaurant, near: CustomerAddress, far: CustomerAddress}
     */
    private function checkoutGraph(): array
    {
        Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);

        $restaurant = Restaurant::create([
            'user_id' => User::factory()->create()->id,
            'name' => 'Test Pizzeria',
            'phone' => '+441234567890',
            'lat' => $this->rLat,
            'lng' => $this->rLng,
            'accepts_cooking_requests' => true,
            'status' => 'active',
            'approval_status' => 'approved',
        ]);

        $menuItem = MenuItem::create([
            'restaurant_id' => $restaurant->id, 'name' => 'Margherita', 'price' => 5, 'is_available' => true,
        ]);

        $customer = User::factory()->create();
        $customer->assignRole('customer');
        $profile = CustomerProfile::create(['user_id' => $customer->id, 'first_name' => 'Test', 'last_name' => 'User']);

        $near = $profile->addresses()->create([
            'label' => 'Home', 'address_line_1' => '1 Near St', 'city' => 'London', 'postcode' => 'AB1 1AA',
            'lat' => $this->rLat + 0.001, 'lng' => $this->rLng + 0.001, 'is_default' => true, 'is_selected' => true,
        ]);
        $far = $profile->addresses()->create([
            'label' => 'Work', 'address_line_1' => '1 Far St', 'city' => 'Faraway', 'postcode' => 'ZZ9 9ZZ',
            'lat' => $this->rLat + 1.0, 'lng' => $this->rLng + 1.0, // ~70 miles
        ]);

        $cart = Cart::create(['user_id' => $customer->id, 'restaurant_id' => $restaurant->id]);
        $cart->items()->create(['menu_item_id' => $menuItem->id, 'quantity' => 2, 'unit_price' => 5]);

        return compact('customer', 'restaurant', 'near', 'far');
    }

    public function test_summary_is_in_range_and_prices_the_bill(): void
    {
        ['customer' => $customer] = $this->checkoutGraph();
        Sanctum::actingAs($customer);

        $this->getJson('/api/customer/checkout')
            ->assertOk()
            ->assertJsonPath('data.in_range', true)
            ->assertJsonPath('data.bill.item_total', 10)
            ->assertJsonPath('data.bill.taxes', 0.5)        // 10 * 5% default
            ->assertJsonPath('data.accepts_cooking_requests', true);
    }

    public function test_summary_flags_an_out_of_range_address(): void
    {
        ['customer' => $customer, 'far' => $far] = $this->checkoutGraph();
        Sanctum::actingAs($customer);

        $this->getJson("/api/customer/checkout?address_id={$far->id}")
            ->assertOk()
            ->assertJsonPath('data.in_range', false)
            ->assertJsonPath('data.bill.to_pay', 0);
    }

    public function test_a_flat_coupon_discounts_the_bill(): void
    {
        ['customer' => $customer] = $this->checkoutGraph();
        Sanctum::actingAs($customer);

        Offer::create(['code' => 'SAVE5', 'type' => 'flat', 'value' => 5, 'trigger' => 'all', 'is_active' => true, 'applicable_to' => 'all']);

        $this->getJson('/api/customer/checkout?coupon=SAVE5')
            ->assertOk()
            ->assertJsonPath('data.applied_coupon.code', 'SAVE5')
            ->assertJsonPath('data.bill.item_discount', 5);
    }

    public function test_an_invalid_coupon_is_surfaced_inline_not_thrown(): void
    {
        ['customer' => $customer] = $this->checkoutGraph();
        Sanctum::actingAs($customer);

        $this->getJson('/api/customer/checkout?coupon=NOPE')
            ->assertOk()
            ->assertJsonPath('data.applied_coupon', null)
            ->assertJsonPath('data.coupon_error', 'This coupon code is not valid.');
    }

    public function test_a_coupon_below_min_order_is_rejected_with_a_helpful_message(): void
    {
        ['customer' => $customer] = $this->checkoutGraph();
        Sanctum::actingAs($customer);

        Offer::create(['code' => 'BIG50', 'type' => 'flat', 'value' => 5, 'min_order_value' => 45, 'trigger' => 'all', 'is_active' => true, 'applicable_to' => 'all']);

        $this->getJson('/api/customer/checkout?coupon=BIG50')
            ->assertOk()
            ->assertJsonPath('data.applied_coupon', null);
    }

    public function test_places_an_order_and_clears_the_cart(): void
    {
        ['customer' => $customer, 'restaurant' => $restaurant, 'near' => $near] = $this->checkoutGraph();
        Sanctum::actingAs($customer);

        $this->postJson('/api/customer/checkout', ['address_id' => $near->id])
            ->assertCreated()
            ->assertJsonPath('data.order.status', 'placed');

        $this->assertDatabaseHas('orders', [
            'user_id' => $customer->id, 'restaurant_id' => $restaurant->id, 'status' => 'placed',
            'subtotal' => 10, 'address_id' => $near->id, // stored as FK, not a JSON snapshot
        ]);
        $this->assertDatabaseHas('order_items', ['name' => 'Margherita', 'quantity' => 2]);
        $this->assertDatabaseCount('cart_items', 0); // cart emptied
    }

    public function test_deleting_the_address_nulls_the_orders_address_id(): void
    {
        ['customer' => $customer, 'near' => $near] = $this->checkoutGraph();
        Sanctum::actingAs($customer);

        $this->postJson('/api/customer/checkout', ['address_id' => $near->id])->assertCreated();
        $this->assertDatabaseHas('orders', ['address_id' => $near->id]);

        $near->delete();

        // FK is ON DELETE SET NULL — the order survives, the address link nulls.
        $this->assertDatabaseCount('orders', 1);
        $this->assertDatabaseHas('orders', ['user_id' => $customer->id, 'address_id' => null]);
    }

    public function test_placing_to_an_out_of_range_address_is_rejected(): void
    {
        ['customer' => $customer, 'far' => $far] = $this->checkoutGraph();
        Sanctum::actingAs($customer);

        $this->postJson('/api/customer/checkout', ['address_id' => $far->id])
            ->assertStatus(422)->assertJsonValidationErrors('address_id');

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_placing_with_a_coupon_records_offer_usage(): void
    {
        ['customer' => $customer, 'near' => $near] = $this->checkoutGraph();
        Sanctum::actingAs($customer);

        $offer = Offer::create(['code' => 'SAVE5', 'type' => 'flat', 'value' => 5, 'trigger' => 'all', 'is_active' => true, 'applicable_to' => 'all']);

        $this->postJson('/api/customer/checkout', ['address_id' => $near->id, 'coupon_code' => 'SAVE5'])
            ->assertCreated();

        $this->assertDatabaseHas('offer_usages', ['offer_id' => $offer->id, 'user_id' => $customer->id, 'discount_applied' => 5]);
        $this->assertDatabaseHas('orders', ['discount_amount' => 5]);
    }

    public function test_web_place_order_redirects_to_dashboard(): void
    {
        ['customer' => $customer, 'near' => $near] = $this->checkoutGraph();
        $this->actingAs($customer);

        $this->post('/customer/checkout', ['address_id' => $near->id])
            ->assertRedirect(route('customer.dashboard'));

        $this->assertDatabaseHas('orders', ['user_id' => $customer->id, 'status' => 'placed']);
    }
}
