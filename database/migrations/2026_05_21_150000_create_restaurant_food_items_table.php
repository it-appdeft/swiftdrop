<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pivot for the partner application's Step 1 food-item picker. Replaces the
 * free-text `cuisines` column for new submissions — restaurants now choose
 * from the admin-managed `food_items` catalog instead of typing tags.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restaurant_food_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained('restaurants')->cascadeOnDelete();
            $table->foreignId('food_item_id')->constrained('food_items')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['restaurant_id', 'food_item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurant_food_items');
    }
};
