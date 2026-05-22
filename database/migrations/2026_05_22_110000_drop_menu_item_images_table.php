<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Drop the legacy `menu_item_images` table. Menu-item photos now live in
 * the polymorphic `uploads` table (collection = "image"), so the dedicated
 * table is redundant.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('menu_item_images');
    }

    public function down(): void
    {
        Schema::create('menu_item_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu_item_id')->constrained()->cascadeOnDelete();
            $table->string('file_path');
            $table->string('alt_text')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['menu_item_id', 'sort_order']);
        });
    }
};
