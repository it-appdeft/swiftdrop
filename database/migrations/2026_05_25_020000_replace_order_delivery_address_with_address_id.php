<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Orders now reference the chosen delivery address by FK instead of storing a
 * JSON snapshot. The FK is nullable and nulls out if the customer deletes the
 * address, so an order's `address_id` becomes null rather than dangling.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('address_id')->nullable()->after('restaurant_id')
                ->constrained('customer_addresses')->nullOnDelete();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('delivery_address');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->json('delivery_address')->nullable();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('address_id');
        });
    }
};
