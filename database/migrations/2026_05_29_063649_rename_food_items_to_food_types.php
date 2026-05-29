<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Rename the "food item" taxonomy to "food type": tables, pivot and the FK
 * column on menu_items. Guarded so it's a no-op on a fresh install (where the
 * create migrations already use the new names) and only renames on databases
 * that were migrated under the old names.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('food_items') && ! Schema::hasTable('food_types')) {
            Schema::rename('food_items', 'food_types');
        }

        if (Schema::hasColumn('menu_items', 'food_item_id')) {
            Schema::table('menu_items', function (Blueprint $table) {
                $table->renameColumn('food_item_id', 'food_type_id');
            });
        }

        if (Schema::hasTable('restaurant_food_items') && ! Schema::hasTable('restaurant_food_types')) {
            Schema::rename('restaurant_food_items', 'restaurant_food_types');
        }

        if (Schema::hasColumn('restaurant_food_types', 'food_item_id')) {
            Schema::table('restaurant_food_types', function (Blueprint $table) {
                $table->renameColumn('food_item_id', 'food_type_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('restaurant_food_types', 'food_type_id')) {
            Schema::table('restaurant_food_types', function (Blueprint $table) {
                $table->renameColumn('food_type_id', 'food_item_id');
            });
        }

        if (Schema::hasTable('restaurant_food_types') && ! Schema::hasTable('restaurant_food_items')) {
            Schema::rename('restaurant_food_types', 'restaurant_food_items');
        }

        if (Schema::hasColumn('menu_items', 'food_type_id')) {
            Schema::table('menu_items', function (Blueprint $table) {
                $table->renameColumn('food_type_id', 'food_item_id');
            });
        }

        if (Schema::hasTable('food_types') && ! Schema::hasTable('food_items')) {
            Schema::rename('food_types', 'food_items');
        }
    }
};
