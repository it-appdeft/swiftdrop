<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Both tables guarded by hasTable() — environments that pre-created
        // these in an earlier ad-hoc step shouldn't fail the migration.
        if (! Schema::hasTable('customer_favorite_restaurants')) {
            Schema::create('customer_favorite_restaurants', function (Blueprint $table) {
                $table->id();
                $table->foreignId('customer_profile_id')->constrained()->cascadeOnDelete();
                $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
                $table->timestamps();

                // Explicit short name — the auto-generated identifier
                // (customer_favorite_restaurants_customer_profile_id_restaurant_id_unique)
                // is 70 chars and exceeds MySQL's 64-char limit.
                $table->unique(['customer_profile_id', 'restaurant_id'], 'cfr_profile_restaurant_unique');
            });
        }

        if (! Schema::hasTable('customer_favorite_menu_items')) {
            Schema::create('customer_favorite_menu_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('customer_profile_id')->constrained()->cascadeOnDelete();
                $table->foreignId('menu_item_id')->constrained()->cascadeOnDelete();
                $table->timestamps();

                $table->unique(['customer_profile_id', 'menu_item_id'], 'cfmi_profile_item_unique');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_favorite_menu_items');
        Schema::dropIfExists('customer_favorite_restaurants');
    }
};
