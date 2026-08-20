<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-dish prices for price-driver (size/variant) options.
 *
 * A "Sets item price" group (e.g. Size) defines option names + the default
 * on the Modifiers page, but the actual prices are set per dish: the same
 * Size group can be £8/£10/£12 on one pizza and £6/£9/£11 on another. Each
 * row is one dish's price for one size option; the presence of a row also
 * marks that the dish offers that option.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_item_modifier_option', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('modifier_option_id')->constrained()->cascadeOnDelete();
            $table->decimal('price', 10, 2)->default(0);
            $table->timestamps();

            $table->unique(['menu_item_id', 'modifier_option_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_item_modifier_option');
    }
};
