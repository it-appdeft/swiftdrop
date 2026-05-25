<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Relational record of the add-ons a customer picked for each cart / order
 * line. Each row is a *snapshot*: alongside the FKs to the live modifier
 * group / option we copy the group name, option name and price delta, so the
 * line still reads correctly if the partner later renames, re-prices or
 * deletes the option. The FKs null out on delete; the snapshot survives.
 *
 * This sits next to the existing `customizations` JSON column on cart_items /
 * order_items (kept for backwards compatibility) but is the source of truth.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cart_item_modifiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cart_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('modifier_group_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('modifier_option_id')->nullable()->constrained()->nullOnDelete();
            // Snapshot at the moment the item was added to the cart.
            $table->string('group_name');
            $table->string('option_name');
            $table->decimal('price_delta', 10, 2)->default(0);
            $table->timestamps();

            $table->index('cart_item_id');
        });

        Schema::create('order_item_modifiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('modifier_group_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('modifier_option_id')->nullable()->constrained()->nullOnDelete();
            // Snapshot frozen at order placement — never changes afterwards.
            $table->string('group_name');
            $table->string('option_name');
            $table->decimal('price_delta', 10, 2)->default(0);
            $table->timestamps();

            $table->index('order_item_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_item_modifiers');
        Schema::dropIfExists('cart_item_modifiers');
    }
};
