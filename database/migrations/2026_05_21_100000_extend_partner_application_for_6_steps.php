<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Schema additions for the redesigned 6-step partner application:
 *
 *   Step 2 (Location & Hours): adds explicit `city` + `pin_code` columns to
 *                              restaurants (full_address stays as the free-text
 *                              line that customers see).
 *   Step 5 (Menu starter):     new restaurant_menu_items table — partners
 *                              can seed signature dishes during onboarding.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            if (! Schema::hasColumn('restaurants', 'city')) {
                $table->string('city', 120)->nullable()->after('full_address');
            }
            if (! Schema::hasColumn('restaurants', 'pin_code')) {
                $table->string('pin_code', 12)->nullable()->after('city');
            }
        });

        Schema::create('restaurant_menu_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained('restaurants')->cascadeOnDelete();
            $table->string('name', 200);
            $table->decimal('price', 10, 2)->nullable();
            $table->enum('diet', ['veg', 'non_veg', 'egg'])->default('veg');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['restaurant_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurant_menu_items');

        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropColumn(['city', 'pin_code']);
        });
    }
};
