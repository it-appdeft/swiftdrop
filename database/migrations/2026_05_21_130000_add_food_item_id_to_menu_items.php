<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->foreignId('food_item_id')
                ->nullable()
                ->after('category_id')
                ->constrained('food_items')
                ->nullOnDelete();

            $table->index(['food_item_id', 'is_available']);
        });
    }

    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropIndex(['food_item_id', 'is_available']);
            $table->dropConstrainedForeignId('food_item_id');
        });
    }
};
