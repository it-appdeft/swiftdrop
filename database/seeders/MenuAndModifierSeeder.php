<?php

namespace Database\Seeders;

use App\Models\FoodType;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\ModifierGroup;
use App\Models\ModifierOption;
use App\Models\Restaurant;
use Illuminate\Database\Seeder;

/**
 * Seeds a representative menu + modifier catalogue for each approved
 * restaurant created by {@see RestaurantSeeder}. Pending-approval rows are
 * skipped because there's no real partner sitting behind them yet.
 *
 * Layout per restaurant:
 *  - Modifier groups (Size / Toppings / Cheese & Dip / Spice / etc.)
 *    with options keyed by (restaurant, name) so re-running stays idempotent.
 *  - Menu categories (Starters, Main course, Breads…).
 *  - Menu items inside those categories, a subset of which attach to one
 *    or more modifier groups via the menu_item_modifier_group pivot.
 *
 * Pricing is in INR (rupees) to match the rest of the demo data. Spice
 * Garden gets the most coverage so the Modifiers + Menu Management UIs
 * have realistic data to exercise on first load.
 */
class MenuAndModifierSeeder extends Seeder
{
    public function run(): void
    {
        // Only seed restaurants that actually finished onboarding. Sushi
        // Wave (pending approval in RestaurantSeeder) is intentionally
        // skipped so the "still applying" path stays empty.
        $restaurants = Restaurant::query()
            ->whereNotNull('application_submitted_at')
            ->get()
            ->keyBy('owner_email');

        // food_type slug → id, so each menu item below links to a global food
        // type (seeded by FoodTypeSeeder) instead of leaving food_type_id null.
        $foodTypes = FoodType::pluck('id', 'slug')->all();

        foreach ($this->blueprint() as $ownerEmail => $config) {
            $restaurant = $restaurants->get($ownerEmail);
            if (! $restaurant) {
                continue;
            }

            $groups = $this->seedModifierGroups($restaurant, $config['modifierGroups']);
            $categories = $this->seedCategories($restaurant, $config['categories']);
            $this->seedItems($restaurant, $config['items'], $categories, $groups, $foodTypes);
        }
    }

    // ─── Writers ────────────────────────────────────────────────────────────

    /**
     * @return array<string, ModifierGroup> map keyed by group name
     */
    protected function seedModifierGroups(Restaurant $restaurant, array $blueprint): array
    {
        $byName = [];

        foreach (array_values($blueprint) as $sortOrder => $g) {
            $group = ModifierGroup::updateOrCreate(
                ['restaurant_id' => $restaurant->id, 'name' => $g['name']],
                [
                    'description' => $g['description'] ?? null,
                    'selection_type' => $g['selection_type'],
                    'is_required' => $g['is_required'] ?? false,
                    'min_selections' => $g['min_selections'] ?? ($g['is_required'] ?? false ? 1 : 0),
                    'max_selections' => $g['max_selections']
                        ?? ($g['selection_type'] === ModifierGroup::SELECTION_SINGLE ? 1 : null),
                    'sort_order' => $sortOrder,
                ],
            );

            // Key on (group, sort_order) rather than name so re-running the
            // seeder updates an option's name + price in place instead of
            // creating a duplicate when only the casing/label changes.
            foreach (array_values($g['options']) as $optSort => $opt) {
                ModifierOption::updateOrCreate(
                    ['modifier_group_id' => $group->id, 'sort_order' => $optSort],
                    [
                        'name' => $opt['name'],
                        'price_delta' => $opt['price_delta'],
                    ],
                );
            }

            $byName[$g['name']] = $group;
        }

        return $byName;
    }

    /**
     * @return array<string, MenuCategory> map keyed by category name
     */
    protected function seedCategories(Restaurant $restaurant, array $names): array
    {
        $byName = [];

        foreach (array_values($names) as $sortOrder => $name) {
            $byName[$name] = MenuCategory::updateOrCreate(
                ['restaurant_id' => $restaurant->id, 'name' => $name],
                ['sort_order' => $sortOrder, 'is_active' => true],
            );
        }

        return $byName;
    }

    /**
     * @param  array<string, MenuCategory>  $categories
     * @param  array<string, ModifierGroup>  $groups
     * @param  array<string, int>  $foodTypes  food_type slug → id
     */
    protected function seedItems(
        Restaurant $restaurant,
        array $items,
        array $categories,
        array $groups,
        array $foodTypes,
    ): void {
        foreach (array_values($items) as $sortOrder => $i) {
            $category = $categories[$i['category']] ?? null;

            /** @var MenuItem $item */
            $item = MenuItem::updateOrCreate(
                ['restaurant_id' => $restaurant->id, 'name' => $i['name']],
                [
                    'category_id' => $category?->id,
                    'food_type_id' => $foodTypes[$i['foodType']] ?? null,
                    'description' => $i['description'] ?? null,
                    'price' => $i['price'],
                    'is_available' => $i['is_available'] ?? true,
                    'is_veg' => $i['is_veg'] ?? false,
                    'sort_order' => $sortOrder,
                ],
            );

            $attachments = [];
            foreach (($i['modifierGroups'] ?? []) as $pivotSort => $groupName) {
                $group = $groups[$groupName] ?? null;
                if ($group) {
                    $attachments[$group->id] = ['sort_order' => $pivotSort];
                }
            }

            // syncWithoutDetaching keeps the seeder idempotent without
            // wiping any manual attachments a partner may have added.
            if ($attachments !== []) {
                $item->modifierGroups()->syncWithoutDetaching($attachments);
            }
        }
    }

    // ─── Blueprint ──────────────────────────────────────────────────────────

    /**
     * Restaurant menus + modifier catalogue. Keyed by the owner's email so
     * we don't depend on database IDs from the upstream RestaurantSeeder.
     *
     * @return array<string, array{
     *   modifierGroups: array<int, array<string, mixed>>,
     *   categories: array<int, string>,
     *   items: array<int, array<string, mixed>>,
     * }>
     */
    protected function blueprint(): array
    {
        return [
            // ─── Spice Garden (London) — Indian ──────────────────────────
            // Also carries the pizza-style Size / Toppings — Veg / Cheese &
            // Dip groups + a Margherita Pizza Giant Slice item so this demo
            // restaurant mirrors the customer-app screenshot exactly.
            'owner@spicegardenldn.co.uk' => [
                'modifierGroups' => [
                    [
                        'name' => 'Size',
                        'description' => 'Pick the portion size.',
                        'selection_type' => ModifierGroup::SELECTION_SINGLE,
                        'is_required' => true,
                        'options' => [
                            ['name' => 'Regular (serves 1, 17 Cm)', 'price_delta' => 0],
                            ['name' => 'Medium (serves 2, 25 Cm)', 'price_delta' => 1.79],
                            ['name' => 'Large (serves 4, 33 Cm)', 'price_delta' => 6.77],
                        ],
                    ],
                    [
                        'name' => 'Toppings — Veg',
                        'description' => 'Add any extras you like.',
                        'selection_type' => ModifierGroup::SELECTION_MULTIPLE,
                        'options' => [
                            ['name' => 'Paneer', 'price_delta' => 1.00],
                            ['name' => 'Onions', 'price_delta' => 2.00],
                            ['name' => 'Olives', 'price_delta' => 1.00],
                            ['name' => 'Jalapenos', 'price_delta' => 2.00],
                            ['name' => 'Red Paprika', 'price_delta' => 1.00],
                            ['name' => 'Pineapples', 'price_delta' => 2.00],
                            ['name' => 'Sweet Corns', 'price_delta' => 2.00],
                        ],
                    ],
                    [
                        'name' => 'Cheese & Dip',
                        'description' => 'Optional cheese boost or dip.',
                        'selection_type' => ModifierGroup::SELECTION_MULTIPLE,
                        'options' => [
                            ['name' => 'Extra Cheese', 'price_delta' => 1.00],
                            ['name' => 'Cheese Dip', 'price_delta' => 2.00],
                            ['name' => 'Jalapeno Dip', 'price_delta' => 1.00],
                            ['name' => 'Hot & Garlic Dip', 'price_delta' => 2.00],
                            ['name' => 'Peri Peri Dip', 'price_delta' => 1.00],
                            ['name' => 'Mozzarella', 'price_delta' => 2.00],
                        ],
                    ],
                    [
                        'name' => 'Spice Level',
                        'description' => 'How hot do you like it?',
                        'selection_type' => ModifierGroup::SELECTION_SINGLE,
                        'is_required' => true,
                        'options' => [
                            ['name' => 'Mild', 'price_delta' => 0],
                            ['name' => 'Medium', 'price_delta' => 0],
                            ['name' => 'Spicy', 'price_delta' => 0],
                        ],
                    ],
                    [
                        'name' => 'Add-ons',
                        'description' => 'Round out the meal.',
                        'selection_type' => ModifierGroup::SELECTION_MULTIPLE,
                        'options' => [
                            ['name' => 'Extra Raita', 'price_delta' => 50],
                            ['name' => 'Papad', 'price_delta' => 30],
                            ['name' => 'Pickle', 'price_delta' => 20],
                        ],
                    ],
                ],
                'categories' => ['Pizzas', 'Starters', 'Main course', 'Breads', 'Rice & Biryani', 'Desserts'],
                'items' => [
                    [
                        'name' => 'Margherita Pizza Giant Slice',
                        'category' => 'Pizzas',
                        'foodType' => 'pizza',
                        'price' => 8.23,
                        'is_veg' => true,
                        'description' => 'Onion, Marinated paneer cubes topped with extra cheese and tandoori sauce',
                        'modifierGroups' => ['Size', 'Toppings — Veg', 'Cheese & Dip'],
                    ],
                    [
                        'name' => 'Paneer Tikka',
                        'category' => 'Starters',
                        'foodType' => 'starter',
                        'price' => 240,
                        'is_veg' => true,
                        'description' => 'Spiced cottage cheese cubes, char-grilled in the tandoor.',
                        'modifierGroups' => ['Spice Level'],
                    ],
                    [
                        'name' => 'Chicken Tikka',
                        'category' => 'Starters',
                        'foodType' => 'starter',
                        'price' => 280,
                        'is_veg' => false,
                        'description' => 'Boneless chicken marinated overnight in yoghurt and spices.',
                        'modifierGroups' => ['Spice Level'],
                    ],
                    [
                        'name' => 'Butter Chicken',
                        'category' => 'Main course',
                        'foodType' => 'curry',
                        'price' => 320,
                        'is_veg' => false,
                        'description' => 'Tandoori chicken in a tomato-butter cream sauce.',
                        'modifierGroups' => ['Spice Level', 'Add-ons'],
                    ],
                    [
                        'name' => 'Mutton Rogan Josh',
                        'category' => 'Main course',
                        'foodType' => 'curry',
                        'price' => 380,
                        'is_veg' => false,
                        'modifierGroups' => ['Spice Level', 'Add-ons'],
                    ],
                    [
                        'name' => 'Paneer Butter Masala',
                        'category' => 'Main course',
                        'foodType' => 'curry',
                        'price' => 290,
                        'is_veg' => true,
                        'modifierGroups' => ['Spice Level', 'Add-ons'],
                    ],
                    [
                        'name' => 'Butter Naan',
                        'category' => 'Breads',
                        'foodType' => 'bread',
                        'price' => 40,
                        'is_veg' => true,
                    ],
                    [
                        'name' => 'Garlic Naan',
                        'category' => 'Breads',
                        'foodType' => 'bread',
                        'price' => 50,
                        'is_veg' => true,
                    ],
                    [
                        'name' => 'Chicken Biryani',
                        'category' => 'Rice & Biryani',
                        'foodType' => 'biryani',
                        'price' => 260,
                        'is_veg' => false,
                        'modifierGroups' => ['Spice Level', 'Add-ons'],
                    ],
                    [
                        'name' => 'Veg Biryani',
                        'category' => 'Rice & Biryani',
                        'foodType' => 'biryani',
                        'price' => 220,
                        'is_veg' => true,
                        'modifierGroups' => ['Spice Level', 'Add-ons'],
                    ],
                    [
                        'name' => 'Gulab Jamun',
                        'category' => 'Desserts',
                        'foodType' => 'dessert',
                        'price' => 60,
                        'is_veg' => true,
                    ],
                ],
            ],

            // ─── Smash Burger Co. (Manchester) — Burgers ─────────────────
            'info@burgersmcr.co.uk' => [
                'modifierGroups' => [
                    [
                        'name' => 'Size',
                        'description' => 'Hungry? Go bigger.',
                        'selection_type' => ModifierGroup::SELECTION_SINGLE,
                        'is_required' => true,
                        'options' => [
                            ['name' => 'Regular (single patty)', 'price_delta' => 0],
                            ['name' => 'Double (two patties)', 'price_delta' => 150],
                            ['name' => 'Triple (three patties)', 'price_delta' => 280],
                        ],
                    ],
                    [
                        'name' => 'Add-ons',
                        'selection_type' => ModifierGroup::SELECTION_MULTIPLE,
                        'max_selections' => 5,
                        'options' => [
                            ['name' => 'Extra Cheese', 'price_delta' => 60],
                            ['name' => 'Bacon', 'price_delta' => 80],
                            ['name' => 'Avocado', 'price_delta' => 90],
                            ['name' => 'Jalapenos', 'price_delta' => 40],
                            ['name' => 'Caramelised Onions', 'price_delta' => 30],
                        ],
                    ],
                ],
                'categories' => ['Burgers', 'Sides', 'Drinks'],
                'items' => [
                    [
                        'name' => 'Classic Smash Burger',
                        'category' => 'Burgers',
                        'foodType' => 'burger',
                        'price' => 420,
                        'is_veg' => false,
                        'description' => 'Hand-smashed beef patty, cheese, pickles, house sauce.',
                        'modifierGroups' => ['Size', 'Add-ons'],
                    ],
                    [
                        'name' => 'Cheese Smash',
                        'category' => 'Burgers',
                        'foodType' => 'burger',
                        'price' => 460,
                        'is_veg' => false,
                        'modifierGroups' => ['Size', 'Add-ons'],
                    ],
                    [
                        'name' => 'Veg Smash',
                        'category' => 'Burgers',
                        'foodType' => 'burger',
                        'price' => 380,
                        'is_veg' => true,
                        'modifierGroups' => ['Size', 'Add-ons'],
                    ],
                    [
                        'name' => 'Truffle Fries',
                        'category' => 'Sides',
                        'foodType' => 'fries',
                        'price' => 220,
                        'is_veg' => true,
                    ],
                    [
                        'name' => 'Coke 500ml',
                        'category' => 'Drinks',
                        'foodType' => 'drinks',
                        'price' => 60,
                        'is_veg' => true,
                    ],
                ],
            ],

            // ─── Napoli Pizza (Birmingham) — Italian ─────────────────────
            // Mirrors the customer-app pizza screen exactly: Size / Toppings
            // — Veg / Cheese & Dip with the same option names and £ prices.
            // Size deltas are relative to the £8.23 base so the customer app
            // renders Regular £8.23, Medium £10.02, Large £15.00.
            'contact@napolipizza.co.uk' => [
                'modifierGroups' => [
                    [
                        'name' => 'Size',
                        'description' => 'Pick the portion size.',
                        'selection_type' => ModifierGroup::SELECTION_SINGLE,
                        'is_required' => true,
                        'options' => [
                            ['name' => 'Regular (serves 1, 17 Cm)', 'price_delta' => 0],
                            ['name' => 'Medium (serves 2, 25 Cm)', 'price_delta' => 1.79],
                            ['name' => 'Large (serves 4, 33 Cm)', 'price_delta' => 6.77],
                        ],
                    ],
                    [
                        'name' => 'Toppings — Veg',
                        'description' => 'Add any extras you like.',
                        'selection_type' => ModifierGroup::SELECTION_MULTIPLE,
                        'options' => [
                            ['name' => 'Paneer', 'price_delta' => 1.00],
                            ['name' => 'Onions', 'price_delta' => 2.00],
                            ['name' => 'Olives', 'price_delta' => 1.00],
                            ['name' => 'Jalapenos', 'price_delta' => 2.00],
                            ['name' => 'Red Paprika', 'price_delta' => 1.00],
                            ['name' => 'Pineapples', 'price_delta' => 2.00],
                            ['name' => 'Sweet Corns', 'price_delta' => 2.00],
                        ],
                    ],
                    [
                        'name' => 'Cheese & Dip',
                        'description' => 'Optional cheese boost or dip.',
                        'selection_type' => ModifierGroup::SELECTION_MULTIPLE,
                        'options' => [
                            ['name' => 'Extra Cheese', 'price_delta' => 1.00],
                            ['name' => 'Cheese Dip', 'price_delta' => 2.00],
                            ['name' => 'Jalapeno Dip', 'price_delta' => 1.00],
                            ['name' => 'Hot & Garlic Dip', 'price_delta' => 2.00],
                            ['name' => 'Peri Peri Dip', 'price_delta' => 1.00],
                            ['name' => 'Mozzarella', 'price_delta' => 2.00],
                        ],
                    ],
                ],
                'categories' => ['Pizzas', 'Sides', 'Drinks'],
                'items' => [
                    [
                        'name' => 'Margherita Pizza Giant Slice',
                        'category' => 'Pizzas',
                        'foodType' => 'pizza',
                        'price' => 8.23,
                        'is_veg' => true,
                        'description' => 'Onion, Marinated paneer cubes topped with extra cheese and tandoori sauce',
                        'modifierGroups' => ['Size', 'Toppings — Veg', 'Cheese & Dip'],
                    ],
                    [
                        'name' => 'Pepperoni',
                        'category' => 'Pizzas',
                        'foodType' => 'pizza',
                        'price' => 9.50,
                        'is_veg' => false,
                        'modifierGroups' => ['Size', 'Cheese & Dip'],
                    ],
                    [
                        'name' => 'Quattro Formaggi',
                        'category' => 'Pizzas',
                        'foodType' => 'pizza',
                        'price' => 10.20,
                        'is_veg' => true,
                        'modifierGroups' => ['Size', 'Toppings — Veg', 'Cheese & Dip'],
                    ],
                    [
                        'name' => 'Garlic Bread',
                        'category' => 'Sides',
                        'foodType' => 'bread',
                        'price' => 3.50,
                        'is_veg' => true,
                    ],
                    [
                        'name' => 'Sparkling Water',
                        'category' => 'Drinks',
                        'foodType' => 'drinks',
                        'price' => 1.80,
                        'is_veg' => true,
                    ],
                ],
            ],

            // ─── Green Thai Kitchen (Bristol) — Thai ─────────────────────
            'admin@greenthaibristol.co.uk' => [
                'modifierGroups' => [
                    [
                        'name' => 'Spice Level',
                        'selection_type' => ModifierGroup::SELECTION_SINGLE,
                        'is_required' => true,
                        'options' => [
                            ['name' => 'Mild', 'price_delta' => 0],
                            ['name' => 'Medium', 'price_delta' => 0],
                            ['name' => 'Thai-hot', 'price_delta' => 0],
                        ],
                    ],
                    [
                        'name' => 'Protein',
                        'description' => 'Choose your protein.',
                        'selection_type' => ModifierGroup::SELECTION_SINGLE,
                        'is_required' => true,
                        'options' => [
                            ['name' => 'Chicken', 'price_delta' => 0],
                            ['name' => 'Prawn', 'price_delta' => 120],
                            ['name' => 'Tofu', 'price_delta' => 0],
                        ],
                    ],
                ],
                'categories' => ['Starters', 'Mains', 'Desserts'],
                'items' => [
                    [
                        'name' => 'Spring Rolls',
                        'category' => 'Starters',
                        'foodType' => 'starter',
                        'price' => 180,
                        'is_veg' => true,
                    ],
                    [
                        'name' => 'Pad Thai',
                        'category' => 'Mains',
                        'foodType' => 'noodles',
                        'price' => 320,
                        'is_veg' => false,
                        'description' => 'Stir-fried rice noodles, tamarind, peanut, lime.',
                        'modifierGroups' => ['Spice Level', 'Protein'],
                    ],
                    [
                        'name' => 'Green Curry',
                        'category' => 'Mains',
                        'foodType' => 'curry',
                        'price' => 360,
                        'is_veg' => false,
                        'modifierGroups' => ['Spice Level', 'Protein'],
                    ],
                    [
                        'name' => 'Mango Sticky Rice',
                        'category' => 'Desserts',
                        'foodType' => 'dessert',
                        'price' => 220,
                        'is_veg' => true,
                    ],
                ],
            ],
        ];
    }
}
