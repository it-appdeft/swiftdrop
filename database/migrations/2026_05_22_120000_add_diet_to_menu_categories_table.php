<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Categories captured during onboarding carry an optional diet tag
 * (veg / non_veg) so the storefront can group/filter by it. Nullable —
 * categories added later from the dashboard may leave it unset.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('menu_categories', function (Blueprint $table) {
            $table->string('diet', 16)->nullable()->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('menu_categories', function (Blueprint $table) {
            $table->dropColumn('diet');
        });
    }
};
