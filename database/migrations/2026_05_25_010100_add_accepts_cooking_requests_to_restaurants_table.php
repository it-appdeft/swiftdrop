<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Whether a restaurant accepts free-text cooking / allergy requests at
 * checkout. When false, the checkout hides the "Cooking Requests" box and
 * any submitted instructions are ignored.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->boolean('accepts_cooking_requests')->default(true)->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropColumn('accepts_cooking_requests');
        });
    }
};
