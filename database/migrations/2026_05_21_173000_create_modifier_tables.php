<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Modifier groups + options + menu-item attachments.
 *
 * A restaurant defines reusable "groups" of selectable options (Size,
 * Toppings, Cheese & Dip…). Each group has a selection type
 * (single / multiple), a required flag, optional min/max selections, and
 * a list of options with a surcharge added to the base item price.
 *
 * Menu items attach to groups via a pivot — one group can power many
 * dishes, one dish can pull in many groups. Drag-to-reorder is honoured
 * by `sort_order` on both groups and options.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('modifier_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('description')->nullable();
            // 'single' (pick one) | 'multiple' (pick multiple)
            $table->string('selection_type', 16)->default('single');
            $table->boolean('is_required')->default(false);
            $table->unsignedSmallInteger('min_selections')->default(0);
            // Null means unbounded — only meaningful when selection_type = 'multiple'.
            $table->unsignedSmallInteger('max_selections')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['restaurant_id', 'sort_order']);
        });

        Schema::create('modifier_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('modifier_group_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            // Surcharge added on top of the base item price. 0 = included.
            $table->decimal('price_delta', 10, 2)->default(0);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['modifier_group_id', 'sort_order']);
        });

        Schema::create('menu_item_modifier_group', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('modifier_group_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            // A group can only attach once per item; ordering driven by sort_order.
            $table->unique(['menu_item_id', 'modifier_group_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_item_modifier_group');
        Schema::dropIfExists('modifier_options');
        Schema::dropIfExists('modifier_groups');
    }
};
