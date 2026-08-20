<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Ledger of everything a driver earns — one row per delivery fee, tip,
        // bonus or adjustment. The driver dashboard sums today's rows for the
        // "Today's Earning" figure.
        Schema::create('driver_earnings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('driver_id')->constrained('driver_profiles')->cascadeOnDelete();
            $table->foreignId('delivery_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('type', ['delivery_fee', 'tip', 'bonus', 'adjustment'])->default('delivery_fee');
            $table->decimal('amount', 10, 2);
            $table->enum('status', ['pending', 'paid'])->default('pending');
            $table->timestamp('earned_at');
            $table->timestamps();

            $table->index(['driver_id', 'earned_at']);
        });

        // When the driver last went online — lets the dashboard report the
        // current online session length ("Time Online"). Null while offline.
        Schema::table('driver_profiles', function (Blueprint $table) {
            $table->timestamp('online_since')->nullable()->after('availability');
        });
    }

    public function down(): void
    {
        Schema::table('driver_profiles', function (Blueprint $table) {
            $table->dropColumn('online_since');
        });

        Schema::dropIfExists('driver_earnings');
    }
};
