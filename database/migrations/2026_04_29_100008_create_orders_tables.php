<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->enum('status', [
                'placed',
                'accepted',
                'preparing',
                'ready_for_pickup',
                'out_for_delivery',
                'delivered',
                'cancelled',
            ])->default('placed');
            $table->decimal('subtotal', 10, 2);
            $table->decimal('delivery_fee', 10, 2);
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('vat_amount', 10, 2)->default(0);
            $table->decimal('total', 10, 2);
            $table->json('delivery_address');
            $table->text('special_instructions')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->enum('cancelled_by', ['customer', 'restaurant', 'system', 'admin'])->nullable();
            $table->timestamp('placed_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('preparing_at')->nullable();
            $table->timestamp('ready_at')->nullable();
            $table->timestamp('picked_up_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['restaurant_id', 'status']);
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('menu_item_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->decimal('unit_price', 10, 2);
            $table->unsignedInteger('quantity');
            $table->json('customizations')->nullable();
            $table->decimal('subtotal', 10, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
