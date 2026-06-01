<?php

namespace Tests\Feature\Customer;

use App\Models\MenuItem;
use App\Models\ModifierGroup;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CartTest extends TestCase
{
    use RefreshDatabase;

    /**
     * A live restaurant with one dish carrying a required single-select "Size"
     * group and an optional multi-select "Toppings" group (max 2), plus a plain
     * dish with no modifiers.
     *
     * @return array{customer: User, pizza: MenuItem, coke: MenuItem, size: ModifierGroup, toppings: ModifierGroup}
     */
    private function cartGraph(): array
    {
        Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);

        $restaurant = $this->makeRestaurant('Test Pizzeria');

        $size = ModifierGroup::create([
            'restaurant_id' => $restaurant->id,
            'name' => 'Size',
            'selection_type' => ModifierGroup::SELECTION_SINGLE,
            'is_required' => true,
        ]);
        $size->options()->createMany([
            ['name' => 'Regular', 'price_delta' => 0, 'sort_order' => 0],
            ['name' => 'Large', 'price_delta' => 5, 'sort_order' => 1],
        ]);

        $toppings = ModifierGroup::create([
            'restaurant_id' => $restaurant->id,
            'name' => 'Toppings',
            'selection_type' => ModifierGroup::SELECTION_MULTIPLE,
            'is_required' => false,
            'max_selections' => 2,
        ]);
        $toppings->options()->createMany([
            ['name' => 'Cheese', 'price_delta' => 1, 'sort_order' => 0],
            ['name' => 'Olives', 'price_delta' => 2, 'sort_order' => 1],
            ['name' => 'Paneer', 'price_delta' => 3, 'sort_order' => 2],
        ]);

        $pizza = MenuItem::create([
            'restaurant_id' => $restaurant->id,
            'name' => 'Margherita',
            'price' => 10,
            'is_available' => true,
            'is_veg' => true,
        ]);
        $pizza->modifierGroups()->attach([
            $size->id => ['sort_order' => 0],
            $toppings->id => ['sort_order' => 1],
        ]);

        $coke = MenuItem::create([
            'restaurant_id' => $restaurant->id,
            'name' => 'Coke',
            'price' => 2,
            'is_available' => true,
        ]);

        $customer = User::factory()->create();
        $customer->assignRole('customer');

        return compact('customer', 'pizza', 'coke', 'size', 'toppings');
    }

    private function makeRestaurant(string $name): Restaurant
    {
        return Restaurant::create([
            'user_id' => User::factory()->create()->id,
            'name' => $name,
            'phone' => '+44'.fake()->numerify('##########'),
            'status' => 'active',
            'approval_status' => 'approved',
        ]);
    }

    public function test_adds_a_dish_with_modifiers_via_api_and_records_priced_snapshot(): void
    {
        ['customer' => $customer, 'pizza' => $pizza, 'size' => $size, 'toppings' => $toppings] = $this->cartGraph();
        Sanctum::actingAs($customer);

        $regular = $size->options()->where('name', 'Regular')->first();
        $cheese = $toppings->options()->where('name', 'Cheese')->first();

        $this->postJson('/api/customer/cart', [
            'menu_item_id' => $pizza->id,
            'quantity' => 2,
            'options' => [$regular->id, $cheese->id],
        ])
            ->assertCreated()
            ->assertJsonPath('data.item_count', 2)
            ->assertJsonPath('data.subtotal', 22)          // (10 + 0 + 1) * 2; whole → JSON int
            ->assertJsonPath('data.items.0.unit_price', 11);

        $this->assertDatabaseHas('cart_items', ['menu_item_id' => $pizza->id, 'quantity' => 2, 'unit_price' => 11]);
        $this->assertDatabaseCount('cart_item_modifiers', 2);
        $this->assertDatabaseHas('cart_item_modifiers', ['group_name' => 'Toppings', 'option_name' => 'Cheese']);
    }

    public function test_merges_identical_line_and_splits_different_customisation(): void
    {
        ['customer' => $customer, 'pizza' => $pizza, 'size' => $size, 'toppings' => $toppings] = $this->cartGraph();
        Sanctum::actingAs($customer);

        $regular = $size->options()->where('name', 'Regular')->first();
        $cheese = $toppings->options()->where('name', 'Cheese')->first();
        $olives = $toppings->options()->where('name', 'Olives')->first();

        $this->postJson('/api/customer/cart', ['menu_item_id' => $pizza->id, 'quantity' => 1, 'options' => [$regular->id, $cheese->id]])->assertCreated();
        $this->postJson('/api/customer/cart', ['menu_item_id' => $pizza->id, 'quantity' => 1, 'options' => [$regular->id, $cheese->id]])->assertCreated();

        $this->assertDatabaseCount('cart_items', 1); // merged

        $this->postJson('/api/customer/cart', ['menu_item_id' => $pizza->id, 'quantity' => 1, 'options' => [$regular->id, $olives->id]])
            ->assertCreated()
            ->assertJsonPath('data.line_count', 2);
    }

    public function test_rejects_missing_required_group_and_over_max_multi_select(): void
    {
        ['customer' => $customer, 'pizza' => $pizza, 'size' => $size, 'toppings' => $toppings] = $this->cartGraph();
        Sanctum::actingAs($customer);

        // Required "Size" not chosen.
        $this->postJson('/api/customer/cart', ['menu_item_id' => $pizza->id, 'quantity' => 1, 'options' => []])
            ->assertStatus(422)->assertJsonValidationErrors('options');

        // Two options for a single-select group.
        $this->postJson('/api/customer/cart', [
            'menu_item_id' => $pizza->id,
            'quantity' => 1,
            'options' => $size->options->pluck('id')->all(),
        ])->assertStatus(422)->assertJsonValidationErrors('options');

        // Three toppings when the group caps at two.
        $regular = $size->options()->where('name', 'Regular')->first();
        $this->postJson('/api/customer/cart', [
            'menu_item_id' => $pizza->id,
            'quantity' => 1,
            'options' => array_merge([$regular->id], $toppings->options->pluck('id')->all()),
        ])->assertStatus(422)->assertJsonValidationErrors('options');
    }

    public function test_rejects_option_that_does_not_belong_to_the_dish(): void
    {
        ['customer' => $customer, 'coke' => $coke, 'size' => $size] = $this->cartGraph();
        Sanctum::actingAs($customer);

        $this->postJson('/api/customer/cart', [
            'menu_item_id' => $coke->id,
            'quantity' => 1,
            'options' => [$size->options->first()->id],
        ])->assertStatus(422)->assertJsonValidationErrors('options');
    }

    public function test_adds_plain_dish_with_no_modifiers_directly(): void
    {
        ['customer' => $customer, 'coke' => $coke] = $this->cartGraph();
        Sanctum::actingAs($customer);

        $this->postJson('/api/customer/cart', ['menu_item_id' => $coke->id, 'quantity' => 3, 'options' => []])
            ->assertCreated()
            ->assertJsonPath('data.item_count', 3);

        $this->assertDatabaseCount('cart_item_modifiers', 0);
    }

    public function test_blocks_adding_from_a_second_restaurant_while_cart_in_use(): void
    {
        ['customer' => $customer, 'coke' => $coke] = $this->cartGraph();
        Sanctum::actingAs($customer);

        $this->postJson('/api/customer/cart', ['menu_item_id' => $coke->id, 'quantity' => 1, 'options' => []])->assertCreated();

        $other = $this->makeRestaurant('Other Diner');
        $otherItem = MenuItem::create(['restaurant_id' => $other->id, 'name' => 'Fries', 'price' => 4, 'is_available' => true]);

        $this->postJson('/api/customer/cart', ['menu_item_id' => $otherItem->id, 'quantity' => 1, 'options' => []])
            ->assertStatus(422)->assertJsonValidationErrors('menu_item_id');
    }

    public function test_updates_and_removes_a_line_via_api(): void
    {
        ['customer' => $customer, 'coke' => $coke] = $this->cartGraph();
        Sanctum::actingAs($customer);

        $this->postJson('/api/customer/cart', ['menu_item_id' => $coke->id, 'quantity' => 1, 'options' => []])->assertCreated();
        $itemId = $customer->cart->items()->first()->id;

        $this->putJson("/api/customer/cart/items/{$itemId}", ['quantity' => 4])
            ->assertOk()->assertJsonPath('data.item_count', 4);

        $this->deleteJson("/api/customer/cart/items/{$itemId}")
            ->assertOk()->assertJsonPath('data.item_count', 0);

        $this->assertDatabaseCount('cart_items', 0);
    }

    public function test_edits_a_lines_options_and_quantity_via_api(): void
    {
        ['customer' => $customer, 'pizza' => $pizza, 'size' => $size, 'toppings' => $toppings] = $this->cartGraph();
        Sanctum::actingAs($customer);

        $regular = $size->options()->where('name', 'Regular')->first();
        $large = $size->options()->where('name', 'Large')->first();
        $cheese = $toppings->options()->where('name', 'Cheese')->first();

        $this->postJson('/api/customer/cart', ['menu_item_id' => $pizza->id, 'quantity' => 1, 'options' => [$regular->id]])->assertCreated();
        $itemId = $customer->cart->items()->first()->id;

        // Re-customise: Large + Cheese, quantity 2 → unit (10 + 5 + 1) = 16.
        $this->putJson("/api/customer/cart/items/{$itemId}", [
            'quantity' => 2,
            'options' => [$large->id, $cheese->id],
        ])
            ->assertOk()
            ->assertJsonPath('data.items.0.unit_price', 16)
            ->assertJsonPath('data.items.0.selected_options', [$large->id, $cheese->id]);

        $this->assertDatabaseHas('cart_items', ['id' => $itemId, 'quantity' => 2, 'unit_price' => 16]);
        $this->assertDatabaseCount('cart_item_modifiers', 2);
        $this->assertDatabaseMissing('cart_item_modifiers', ['cart_item_id' => $itemId, 'option_name' => 'Regular']);
    }

    public function test_editing_a_line_to_match_another_combo_merges_them(): void
    {
        ['customer' => $customer, 'pizza' => $pizza, 'size' => $size, 'toppings' => $toppings] = $this->cartGraph();
        Sanctum::actingAs($customer);

        $regular = $size->options()->where('name', 'Regular')->first();
        $cheese = $toppings->options()->where('name', 'Cheese')->first();

        // Two distinct combos → two lines.
        $this->postJson('/api/customer/cart', ['menu_item_id' => $pizza->id, 'quantity' => 2, 'options' => [$regular->id]])->assertCreated();
        $this->postJson('/api/customer/cart', ['menu_item_id' => $pizza->id, 'quantity' => 1, 'options' => [$regular->id, $cheese->id]])->assertCreated();
        $this->assertDatabaseCount('cart_items', 2);

        $cheeseLine = $customer->cart->items()->get()->first(fn ($i) => $i->modifiers->count() === 2);

        // Edit the cheese line back to plain Regular → folds into the first line.
        $this->putJson("/api/customer/cart/items/{$cheeseLine->id}", [
            'quantity' => 1,
            'options' => [$regular->id],
        ])->assertOk()->assertJsonPath('data.line_count', 1);

        $this->assertDatabaseCount('cart_items', 1);
        $this->assertDatabaseMissing('cart_items', ['id' => $cheeseLine->id]);
        $this->assertDatabaseHas('cart_items', ['menu_item_id' => $pizza->id, 'quantity' => 3]); // 2 + 1
    }

    public function test_rejects_an_option_edit_that_breaks_the_dishs_rules(): void
    {
        ['customer' => $customer, 'pizza' => $pizza, 'size' => $size, 'toppings' => $toppings] = $this->cartGraph();
        Sanctum::actingAs($customer);

        $regular = $size->options()->where('name', 'Regular')->first();

        $this->postJson('/api/customer/cart', ['menu_item_id' => $pizza->id, 'quantity' => 1, 'options' => [$regular->id]])->assertCreated();
        $itemId = $customer->cart->items()->first()->id;

        // Drop the required Size group → validation error, line untouched.
        $this->putJson("/api/customer/cart/items/{$itemId}", ['quantity' => 1, 'options' => []])
            ->assertStatus(422)->assertJsonValidationErrors('options');

        // Three toppings exceeds the max of two.
        $this->putJson("/api/customer/cart/items/{$itemId}", [
            'quantity' => 1,
            'options' => array_merge([$regular->id], $toppings->options->pluck('id')->all()),
        ])->assertStatus(422)->assertJsonValidationErrors('options');

        $this->assertDatabaseHas('cart_item_modifiers', ['cart_item_id' => $itemId, 'option_name' => 'Regular']);
    }

    public function test_adds_to_cart_through_web_inertia_controller(): void
    {
        ['customer' => $customer, 'pizza' => $pizza, 'size' => $size] = $this->cartGraph();
        $this->actingAs($customer);

        $regular = $size->options()->where('name', 'Regular')->first();

        $this->post('/customer/cart', [
            'menu_item_id' => $pizza->id,
            'quantity' => 1,
            'options' => [$regular->id],
        ])->assertRedirect();

        $this->assertDatabaseHas('cart_items', ['menu_item_id' => $pizza->id, 'quantity' => 1, 'unit_price' => 10]);
    }
}
