<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Renamed to food_type_id post-launch; the rename migration handles
        // databases created under the old name. Guard keeps fresh installs
        // from clashing with that later rename.
        if (Schema::hasColumn('menu_items', 'food_type_id') || Schema::hasColumn('menu_items', 'food_item_id')) {
            return;
        }

        Schema::table('menu_items', function (Blueprint $table) {
            $table->foreignId('food_type_id')
                ->nullable()
                ->after('category_id')
                ->constrained('food_types')
                ->nullOnDelete();

            $table->index(['food_type_id', 'is_available']);
        });
    }

    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropIndex(['food_type_id', 'is_available']);
            $table->dropConstrainedForeignId('food_type_id');
        });
    }
};
