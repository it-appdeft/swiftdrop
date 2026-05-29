<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Variant pricing support.
 *
 * A "price-driver" group (e.g. Pizza size) sets the item's base price
 * instead of adding a surcharge on top of it. The group is flagged via
 * `is_price_driver`; within it, exactly one option is the `is_default`
 * whose absolute price prefills the menu item's Price field. When a
 * price-driver group is attached to an item, each option's `price_delta`
 * column holds the ABSOLUTE price for that size (not a delta).
 *
 * The behaviour is keyed off this flag, never the group name — partners
 * can rename "Size" to anything without breaking pricing.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('modifier_groups', function (Blueprint $table) {
            $table->boolean('is_price_driver')->default(false)->after('selection_type');
        });

        Schema::table('modifier_options', function (Blueprint $table) {
            $table->boolean('is_default')->default(false)->after('price_delta');
        });
    }

    public function down(): void
    {
        Schema::table('modifier_groups', function (Blueprint $table) {
            $table->dropColumn('is_price_driver');
        });

        Schema::table('modifier_options', function (Blueprint $table) {
            $table->dropColumn('is_default');
        });
    }
};
