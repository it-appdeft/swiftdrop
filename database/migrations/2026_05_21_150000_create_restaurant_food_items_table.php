<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pivot for the partner application's Step 1 food-type picker. Replaces the
 * free-text `cuisines` column for new submissions — restaurants now choose
 * from the admin-managed `food_types` catalog instead of typing tags.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Renamed to restaurant_food_types post-launch; the rename migration
        // handles databases created under the old name. Guard keeps fresh
        // installs from clashing with that later rename.
        if (Schema::hasTable('restaurant_food_types') || Schema::hasTable('restaurant_food_items')) {
            return;
        }

        Schema::create('restaurant_food_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained('restaurants')->cascadeOnDelete();
            $table->foreignId('food_type_id')->constrained('food_types')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['restaurant_id', 'food_type_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurant_food_types');
    }
};
