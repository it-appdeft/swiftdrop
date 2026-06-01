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

    private function customer(): User
    {
        Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
        $customer = User::factory()->create();
        $customer->assignRole('customer');
        CustomerProfile::create(['user_id' => $customer->id, 'first_name' => 'T', 'last_name' => 'U']);

        return $customer;
    }

    private function restaurant(string $name): Restaurant
    {
        return Restaurant::create([
            'user_id' => User::factory()->create()->id,
            'name' => $name,
            'city' => 'London',
            'phone' => '+44'.fake()->numerify('##########'),
            'status' => 'active',
            'approval_status' => 'approved',
        ]);
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

        $this->getJson('/api/customer/search/items?search=pizza')
            ->assertOk()
            ->assertJsonPath('data.results.0.items.0.name', 'Pizza Api')
            ->assertJsonPath('data.cart.items.0.menu_item_id', $pizza->id)
            ->assertJsonPath('data.cart.items.0.quantity', 2)
            ->assertJsonPath('data.cart.items.0.selected_options', [$regular->id]);
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
