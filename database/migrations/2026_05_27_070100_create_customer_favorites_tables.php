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

                $table->unique(['customer_profile_id', 'restaurant_id']);
            });
        }

        if (! Schema::hasTable('customer_favorite_menu_items')) {
            Schema::create('customer_favorite_menu_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('customer_profile_id')->constrained()->cascadeOnDelete();
                $table->foreignId('menu_item_id')->constrained()->cascadeOnDelete();
                $table->timestamps();

                $table->unique(['customer_profile_id', 'menu_item_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_favorite_menu_items');
        Schema::dropIfExists('customer_favorite_restaurants');
    }
};
