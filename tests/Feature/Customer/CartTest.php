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
        $restaurant = Restaurant::create([
            'user_id' => User::factory()->create()->id,
            'name' => $name,
            'phone' => '+44'.fake()->numerify('##########'),
            'status' => 'active',
            'approval_status' => 'approved',
            'is_accepting_orders' => true,
        ]);

        // Open today, all day — the cart's add/increase guard requires the
        // restaurant to be orderable + within its operating hours.
        $restaurant->hours()->create([
            'day_of_week' => strtolower(now()->format('D')),
            'is_open' => true,
            'open_from' => '00:00',
            'open_to' => '23:59',
        ]);

        return $restaurant;
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

    /**
     * End-to-end "repeat previous customisation" flow over the API — the same
     * sequence the web restaurant/search pages drive:
     *   1. POST add combo A (Regular + Cheese)            → line A, qty 1
     *   2. POST add combo B (Large + Olives)              → line B, qty 1 (kept distinct)
     *   3. GET cart                                        → both combos visible with modifiers
     *   4. PUT items/{A} quantity+1  ("Repeat" combo A)    → line A qty 2, still 2 lines
     *   5. POST add combo A again    ("I'll Choose" → A)   → merges into line A (qty 3)
     */
    public function test_api_repeat_customisation_flow_lists_all_combos_and_merges_by_signature(): void
    {
        ['customer' => $customer, 'pizza' => $pizza, 'size' => $size, 'toppings' => $toppings] = $this->cartGraph();
        Sanctum::actingAs($customer);

        $regular = $size->options()->where('name', 'Regular')->first();
        $large = $size->options()->where('name', 'Large')->first();
        $cheese = $toppings->options()->where('name', 'Cheese')->first();
        $olives = $toppings->options()->where('name', 'Olives')->first();

        // 1. Combo A.
        $lineA = $this->postJson('/api/customer/cart', ['menu_item_id' => $pizza->id, 'quantity' => 1, 'options' => [$regular->id, $cheese->id]])
            ->assertCreated()
            ->json('data.items.0.id');

        // 2. Combo B — a different option set, so it must NOT merge.
        $this->postJson('/api/customer/cart', ['menu_item_id' => $pizza->id, 'quantity' => 1, 'options' => [$large->id, $olives->id]])
            ->assertCreated()
            ->assertJsonPath('data.line_count', 2);

        // 3. Both combos are listed for the dish, each with its frozen modifiers —
        //    this is what the "repeat" prompt renders (all combos, not just last).
        $cart = $this->getJson('/api/customer/cart')->assertOk();
        $cart->assertJsonPath('data.line_count', 2);
        $names = collect($cart->json('data.items'))
            ->map(fn ($i) => collect($i['modifiers'])->pluck('option_name')->sort()->values()->all())
            ->all();
        $this->assertContains(['Cheese', 'Regular'], $names);
        $this->assertContains(['Large', 'Olives'], $names);

        // 4. "Repeat" combo A → bump just that line's quantity, no new line.
        $this->putJson("/api/customer/cart/items/{$lineA}", ['quantity' => 2])
            ->assertOk()
            ->assertJsonPath('data.line_count', 2);

        // 5. "I'll Choose" the same options as combo A → backend folds it into A.
        $this->postJson('/api/customer/cart', ['menu_item_id' => $pizza->id, 'quantity' => 1, 'options' => [$cheese->id, $regular->id]])
            ->assertCreated()
            ->assertJsonPath('data.line_count', 2);

        $this->assertDatabaseHas('cart_items', ['id' => $lineA, 'quantity' => 3]);
    }

    /**
     * The restaurant detail payload rolls a dish's cart lines up onto the dish
     * itself: is_in_cart, the TOTAL quantity across every combo, the distinct
     * line count, and the lines. This is what lets the API + web read the dish's
     * cart state directly instead of re-deriving it (and the old keyBy collapse
     * meant cart_quantity only reflected the last combo).
     */
    public function test_detail_payload_aggregates_all_cart_lines_onto_the_dish(): void
    {
        ['customer' => $customer, 'pizza' => $pizza, 'size' => $size, 'toppings' => $toppings] = $this->cartGraph();
        Sanctum::actingAs($customer);

        $regular = $size->options()->where('name', 'Regular')->first();
        $large = $size->options()->where('name', 'Large')->first();
        $cheese = $toppings->options()->where('name', 'Cheese')->first();
        $olives = $toppings->options()->where('name', 'Olives')->first();

        // Same pizza, two different combos → two lines, total quantity 2 + 1 = 3.
        $this->postJson('/api/customer/cart', ['menu_item_id' => $pizza->id, 'quantity' => 2, 'options' => [$regular->id, $cheese->id]])->assertCreated();
        $this->postJson('/api/customer/cart', ['menu_item_id' => $pizza->id, 'quantity' => 1, 'options' => [$large->id, $olives->id]])->assertCreated();

        $response = $this->getJson("/api/customer/restaurants/{$pizza->restaurant_id}")->assertOk();

        $response
            ->assertJsonPath('data.categories.0.items.0.id', $pizza->id)
            ->assertJsonPath('data.categories.0.items.0.is_in_cart', true)
            ->assertJsonPath('data.categories.0.items.0.cart_quantity', 3)
            ->assertJsonPath('data.categories.0.items.0.cart_line_count', 2);

        $this->assertCount(2, $response->json('data.categories.0.items.0.cart_lines'));

        // The plain Coke is untouched — empty cart state, not in cart.
        $this->assertSame('Coke', $response->json('data.categories.0.items.1.name'));
        $response
            ->assertJsonPath('data.categories.0.items.1.is_in_cart', false)
            ->assertJsonPath('data.categories.0.items.1.cart_quantity', 0)
            ->assertJsonPath('data.categories.0.items.1.cart_line_count', 0);
    }

    public function test_merge_ignores_the_order_options_are_submitted_in(): void
    {
        ['customer' => $customer, 'pizza' => $pizza, 'size' => $size, 'toppings' => $toppings] = $this->cartGraph();
        Sanctum::actingAs($customer);

        $regular = $size->options()->where('name', 'Regular')->first();
        $cheese = $toppings->options()->where('name', 'Cheese')->first();

        // Same modifier set, submitted in opposite order, must fold into one
        // line — the signature is order-independent (ids are sorted).
        $this->postJson('/api/customer/cart', ['menu_item_id' => $pizza->id, 'quantity' => 1, 'options' => [$regular->id, $cheese->id]])->assertCreated();
        $this->postJson('/api/customer/cart', ['menu_item_id' => $pizza->id, 'quantity' => 2, 'options' => [$cheese->id, $regular->id]])
            ->assertCreated()
            ->assertJsonPath('data.line_count', 1)
            ->assertJsonPath('data.items.0.quantity', 3);
    }

    public function test_adds_with_no_options_and_rejects_over_max_multi_select(): void
    {
        ['customer' => $customer, 'pizza' => $pizza, 'size' => $size, 'toppings' => $toppings] = $this->cartGraph();
        Sanctum::actingAs($customer);

        // Modifiers are optional — adding with no options (the quick "+" path)
        // succeeds even though "Size" is a required group.
        $this->postJson('/api/customer/cart', ['menu_item_id' => $pizza->id, 'quantity' => 1, 'options' => []])
            ->assertCreated();

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

        // Three toppings exceeds the max of two → validation error, line untouched.
        $this->putJson("/api/customer/cart/items/{$itemId}", [
            'quantity' => 1,
            'options' => array_merge([$regular->id], $toppings->options->pluck('id')->all()),
        ])->assertStatus(422)->assertJsonValidationErrors('options');

        $this->assertDatabaseHas('cart_item_modifiers', ['cart_item_id' => $itemId, 'option_name' => 'Regular']);

        // Modifiers are optional now: clearing them is allowed (no required group).
        $this->putJson("/api/customer/cart/items/{$itemId}", ['quantity' => 1, 'options' => []])
            ->assertOk();
        $this->assertDatabaseMissing('cart_item_modifiers', ['cart_item_id' => $itemId, 'option_name' => 'Regular']);
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

    public function test_adding_is_blocked_when_the_restaurant_is_not_accepting_orders(): void
    {
        ['customer' => $customer, 'pizza' => $pizza, 'size' => $size] = $this->cartGraph();
        Sanctum::actingAs($customer);

        // The restaurant pauses after the customer opened it.
        $pizza->restaurant->update(['is_accepting_orders' => false]);
        $regular = $size->options()->where('name', 'Regular')->first();

        $this->postJson('/api/customer/cart', ['menu_item_id' => $pizza->id, 'quantity' => 1, 'options' => [$regular->id]])
            ->assertStatus(422)
            ->assertJsonValidationErrors('menu_item_id');

        $this->assertDatabaseCount('cart_items', 0);
    }

    public function test_increasing_quantity_is_blocked_when_the_restaurant_is_closed_but_removing_is_allowed(): void
    {
        ['customer' => $customer, 'coke' => $coke] = $this->cartGraph();
        Sanctum::actingAs($customer);

        $this->postJson('/api/customer/cart', ['menu_item_id' => $coke->id, 'quantity' => 1, 'options' => []])->assertCreated();
        $itemId = $customer->cart->items()->first()->id;

        // Restaurant closes (today marked not-open).
        $coke->restaurant->hours()->update(['is_open' => false]);

        // Increase is rejected…
        $this->putJson("/api/customer/cart/items/{$itemId}", ['quantity' => 3])
            ->assertStatus(422)
            ->assertJsonValidationErrors('menu_item_id');

        // …but lowering / removing is still allowed so the cart can be cleared.
        $this->putJson("/api/customer/cart/items/{$itemId}", ['quantity' => 0])
            ->assertOk()
            ->assertJsonPath('data.item_count', 0);

        $this->assertDatabaseCount('cart_items', 0);
    }

    public function test_edits_a_lines_options_through_web_inertia_controller(): void
    {
        ['customer' => $customer, 'pizza' => $pizza, 'size' => $size, 'toppings' => $toppings] = $this->cartGraph();
        $this->actingAs($customer);

        $regular = $size->options()->where('name', 'Regular')->first();
        $large = $size->options()->where('name', 'Large')->first();
        $cheese = $toppings->options()->where('name', 'Cheese')->first();

        $this->post('/customer/cart', ['menu_item_id' => $pizza->id, 'quantity' => 1, 'options' => [$regular->id]])->assertRedirect();
        $itemId = $customer->cart->items()->first()->id;

        // Edit-and-save from the modifier dialog: Large + Cheese, quantity 2 →
        // unit (10 + 5 + 1) = 16. Sending `options` routes the web controller
        // onto the re-customise path, rewriting this line in place.
        $this->put("/customer/cart/items/{$itemId}", ['quantity' => 2, 'options' => [$large->id, $cheese->id]])
            ->assertRedirect();

        $this->assertDatabaseHas('cart_items', ['id' => $itemId, 'quantity' => 2, 'unit_price' => 16]);
        $this->assertDatabaseHas('cart_item_modifiers', ['cart_item_id' => $itemId, 'option_name' => 'Large']);
        $this->assertDatabaseMissing('cart_item_modifiers', ['cart_item_id' => $itemId, 'option_name' => 'Regular']);
    }

    public function test_editing_with_an_invalid_option_set_is_rejected_through_web(): void
    {
        ['customer' => $customer, 'pizza' => $pizza, 'size' => $size] = $this->cartGraph();
        $this->actingAs($customer);

        $regular = $size->options()->where('name', 'Regular')->first();
        $this->post('/customer/cart', ['menu_item_id' => $pizza->id, 'quantity' => 1, 'options' => [$regular->id]])->assertRedirect();
        $itemId = $customer->cart->items()->first()->id;

        // Two picks for a single-select group is invalid — the edit is rejected
        // and the line keeps its original customisation.
        $this->from('/customer/cart')
            ->put("/customer/cart/items/{$itemId}", ['quantity' => 1, 'options' => $size->options->pluck('id')->all()])
            ->assertRedirect('/customer/cart')
            ->assertSessionHasErrors('options');

        $this->assertDatabaseHas('cart_item_modifiers', ['cart_item_id' => $itemId, 'option_name' => 'Regular']);
    }
}
