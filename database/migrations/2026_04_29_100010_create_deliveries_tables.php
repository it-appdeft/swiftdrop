<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('driver_id')->nullable()->constrained('driver_profiles')->nullOnDelete();
            $table->enum('status', ['pending_assignment', 'assigned', 'picked_up', 'delivered', 'failed'])->default('pending_assignment');
            $table->unsignedInteger('eta_minutes')->nullable();
            $table->decimal('distance_miles', 6, 2)->nullable();
            $table->unsignedTinyInteger('assignment_attempts')->default(0);
            $table->timestamp('picked_up_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->text('failure_reason')->nullable();
            $table->timestamps();

            $table->index(['driver_id', 'status']);
        });

        Schema::create('driver_location_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('driver_id')->constrained('driver_profiles')->cascadeOnDelete();
            $table->foreignId('delivery_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('lat', 10, 8);
            $table->decimal('lng', 11, 8);
            $table->timestamp('recorded_at')->nullable();

            $table->index(['driver_id', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('driver_location_logs');
        Schema::dropIfExists('deliveries');
    }
};
