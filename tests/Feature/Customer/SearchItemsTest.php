<?php

namespace Tests\Feature\Customer;

use App\Models\CustomerProfile;
use App\Models\MenuItem;
use App\Models\ModifierGroup;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SearchItemsTest extends TestCase
{
    use RefreshDatabase;

    // London — shared by the customer's saved address and the restaurants so
    // location-driven search (web reads the address, the API reads these coords)
    // resolves them within the discovery radius.
    private const LAT = 51.5074;

    private const LNG = -0.1278;

    private function customer(): User
    {
        Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
        $customer = User::factory()->create();
        $customer->assignRole('customer');
        $profile = CustomerProfile::create(['user_id' => $customer->id, 'first_name' => 'T', 'last_name' => 'U']);
        // Geocoded address so the web search has a location to discover from.
        $profile->addresses()->create([
            'label' => 'Home', 'address_line_1' => '1 St', 'city' => 'London', 'postcode' => 'AB1 1AA',
            'lat' => self::LAT, 'lng' => self::LNG, 'is_default' => true, 'is_selected' => true,
        ]);

        return $customer;
    }

    private function restaurant(string $name): Restaurant
    {
        $restaurant = Restaurant::create([
            'user_id' => User::factory()->create()->id,
            'name' => $name,
            'city' => 'London',
            'phone' => '+44'.fake()->numerify('##########'),
            'status' => 'active',
            'approval_status' => 'approved',
            'is_accepting_orders' => true,
            'lat' => self::LAT,
            'lng' => self::LNG,
        ]);

        // Open today, all day — adding to cart requires the restaurant to be
        // orderable + within its operating hours.
        $restaurant->hours()->create([
            'day_of_week' => strtolower(now()->format('D')),
            'is_open' => true,
            'open_from' => '00:00',
            'open_to' => '23:59',
        ]);

        return $restaurant;
    }

    public function test_items_search_page_renders_with_dishes_and_a_cart_prop(): void
    {
        $customer = $this->customer();
        $restaurant = $this->restaurant('Pizza Place');
        MenuItem::create(['restaurant_id' => $restaurant->id, 'name' => 'Pizza Margherita', 'price' => 10, 'is_available' => true]);

        // This route previously 500'd: CustomerSearchResource referenced an
        // uncaptured $request inside the dishes_by_restaurant closure.
        $this->actingAs($customer)
            ->get('/customer/search/items?search=pizza')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('customer/search', false)
                ->where('results.type', 'items')
                ->has('results.dishes_by_restaurant', 1)
                ->where('results.dishes_by_restaurant.0.dishes.0.name', 'Pizza Margherita')
                ->has('cart')
                ->has('cart.items'),
            );
    }

    public function test_items_search_caps_dishes_at_three_per_restaurant(): void
    {
        $customer = $this->customer();
        $restaurant = $this->restaurant('Pizza Palace');
        foreach (['Pizza One', 'Pizza Two', 'Pizza Three', 'Pizza Four', 'Pizza Five'] as $i => $name) {
            MenuItem::create([
                'restaurant_id' => $restaurant->id,
                'name' => $name,
                'price' => 10 + $i,
                'is_available' => true,
                'sort_order' => $i,
            ]);
        }

        $this->actingAs($customer)
            ->get('/customer/search/items?search=pizza')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('results.dishes_by_restaurant.0.dishes', 3),
            );
    }

    public function test_items_search_api_returns_dishes_and_the_same_cart_shape(): void
    {
        $customer = $this->customer();
        $restaurant = $this->restaurant('Api Pizza Co');

        $size = ModifierGroup::create([
            'restaurant_id' => $restaurant->id,
            'name' => 'Size',
            'selection_type' => ModifierGroup::SELECTION_SINGLE,
            'is_required' => true,
        ]);
        $regular = $size->options()->create(['name' => 'Regular', 'price_delta' => 0, 'sort_order' => 0]);

        $pizza = MenuItem::create(['restaurant_id' => $restaurant->id, 'name' => 'Pizza Api', 'price' => 10, 'is_available' => true]);
        $pizza->modifierGroups()->attach([$size->id => ['sort_order' => 0]]);

        Sanctum::actingAs($customer);

        // Seed the cart so the API search payload echoes it back.
        $this->postJson('/api/customer/cart', ['menu_item_id' => $pizza->id, 'quantity' => 2, 'options' => [$regular->id]])
            ->assertCreated();

        // API search is location-driven: pass the frontend coordinates.
        $this->getJson('/api/customer/search/items?search=pizza&latitude='.self::LAT.'&longitude='.self::LNG)
            ->assertOk()
            ->assertJsonPath('data.results.0.items.0.name', 'Pizza Api')
            ->assertJsonPath('data.cart.items.0.menu_item_id', $pizza->id)
            ->assertJsonPath('data.cart.items.0.quantity', 2)
            ->assertJsonPath('data.cart.items.0.selected_options', [$regular->id]);
    }

    public function test_items_search_includes_out_of_order_restaurants_with_a_flag_for_graying(): void
    {
        $customer = $this->customer();

        // Higher rating so the open restaurant sorts first deterministically
        // (the Items query orders by rating desc).
        $open = $this->restaurant('Open Pizza Co');
        $open->update(['rating' => 4.8]);
        MenuItem::create(['restaurant_id' => $open->id, 'name' => 'Pizza Open', 'price' => 10, 'is_available' => true]);

        // Out of order (partner pause toggle off) — kept in the response so the
        // frontend can gray it out and strip the Add button, carrying the
        // is_accepting_orders flag that drives that.
        $paused = $this->restaurant('Paused Pizza Co');
        $paused->update(['is_accepting_orders' => false, 'rating' => 3.0]);
        MenuItem::create(['restaurant_id' => $paused->id, 'name' => 'Pizza Paused', 'price' => 10, 'is_available' => true]);

        $this->actingAs($customer)
            ->get('/customer/search/items?search=pizza')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('results.dishes_by_restaurant', 2)
                ->where('results.dishes_by_restaurant.0.restaurant.is_accepting_orders', true)
                ->where('results.dishes_by_restaurant.1.restaurant.is_accepting_orders', false),
            );
    }

    public function test_items_search_includes_unavailable_dishes_flagged_for_graying(): void
    {
        $customer = $this->customer();
        $restaurant = $this->restaurant('Mixed Pizza Co');

        MenuItem::create(['restaurant_id' => $restaurant->id, 'name' => 'Pizza Live', 'price' => 10, 'is_available' => true, 'sort_order' => 0]);
        // Off-menu dish: still listed on the Items tab so the frontend can gray
        // it and drop the Add button — sorted after available dishes.
        MenuItem::create(['restaurant_id' => $restaurant->id, 'name' => 'Pizza Sold Out', 'price' => 12, 'is_available' => false, 'sort_order' => 1]);

        $this->actingAs($customer)
            ->get('/customer/search/items?search=pizza')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('results.dishes_by_restaurant.0.dishes', 2)
                ->where('results.dishes_by_restaurant.0.dishes.0.name', 'Pizza Live')
                ->where('results.dishes_by_restaurant.0.dishes.0.is_available', true)
                ->where('results.dishes_by_restaurant.0.dishes.1.name', 'Pizza Sold Out')
                ->where('results.dishes_by_restaurant.0.dishes.1.is_available', false),
            );
    }

    public function test_in_cart_dish_exposes_quantity_and_selected_options_for_the_card(): void
    {
        $customer = $this->customer();
        $restaurant = $this->restaurant('Customisable Co');

        $size = ModifierGroup::create([
            'restaurant_id' => $restaurant->id,
            'name' => 'Size',
            'selection_type' => ModifierGroup::SELECTION_SINGLE,
            'is_required' => true,
        ]);
        $regular = $size->options()->create(['name' => 'Regular', 'price_delta' => 0, 'sort_order' => 0]);

        $pizza = MenuItem::create(['restaurant_id' => $restaurant->id, 'name' => 'Pizza Custom', 'price' => 10, 'is_available' => true]);
        $pizza->modifierGroups()->attach([$size->id => ['sort_order' => 0]]);

        // Put it in the cart with the Regular option, quantity 2.
        $this->actingAs($customer)
            ->post('/customer/cart', ['menu_item_id' => $pizza->id, 'quantity' => 2, 'options' => [$regular->id]])
            ->assertRedirect();

        $this->actingAs($customer)
            ->get('/customer/search/items?search=pizza')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('cart.items.0.menu_item_id', $pizza->id)
                ->where('cart.items.0.quantity', 2)
                ->where('cart.items.0.selected_options', [$regular->id]),
            );
    }
}
