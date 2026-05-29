<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Renamed to food_types post-launch; the rename migration handles
        // databases created under the old name. Guard keeps fresh installs
        // from clashing with that later rename.
        if (Schema::hasTable('food_types') || Schema::hasTable('food_items')) {
            return;
        }

        Schema::create('food_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('image')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('food_types');
    }
};
