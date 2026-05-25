<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Optional "how to reach" note captured on the Address Details step of the
 * map-based add-address flow (e.g. "Take the first left next to red gate").
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customer_addresses', function (Blueprint $table) {
            $table->string('delivery_instructions', 500)->nullable()->after('postcode');
        });
    }

    public function down(): void
    {
        Schema::table('customer_addresses', function (Blueprint $table) {
            $table->dropColumn('delivery_instructions');
        });
    }
};
