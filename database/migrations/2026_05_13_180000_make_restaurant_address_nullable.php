<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Restaurant address details (street, city, postcode, lat/lng) are collected
 * during partner onboarding, not at signup. Relax the NOT NULL constraints so
 * a stub `restaurants` row can be created on registration and completed later.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->string('address_line_1')->nullable()->change();
            $table->string('city')->nullable()->change();
            $table->string('postcode', 10)->nullable()->change();
            $table->decimal('lat', 10, 8)->nullable()->change();
            $table->decimal('lng', 11, 8)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->string('address_line_1')->nullable(false)->change();
            $table->string('city')->nullable(false)->change();
            $table->string('postcode', 10)->nullable(false)->change();
            $table->decimal('lat', 10, 8)->nullable(false)->change();
            $table->decimal('lng', 11, 8)->nullable(false)->change();
        });
    }
};
