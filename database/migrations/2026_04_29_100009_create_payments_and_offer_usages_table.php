<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('order_id')->unique()->constrained()->cascadeOnDelete();
            $table->enum('method', ['card', 'open_banking', 'cod', 'wallet']);
            $table->enum('status', ['pending', 'success', 'failed', 'refunded', 'partially_refunded'])->default('pending');
            $table->decimal('amount', 10, 2);
            $table->char('currency', 3)->default('GBP');
            $table->string('gateway_txn_id')->nullable();
            $table->json('gateway_response')->nullable();
            $table->decimal('refunded_amount', 10, 2)->default(0);
            $table->string('refund_txn_id')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->timestamps();
        });

        Schema::create('offer_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('offer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->decimal('discount_applied', 10, 2);
            $table->timestamp('created_at')->nullable();

            $table->index(['offer_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('offer_usages');
        Schema::dropIfExists('payments');
    }
};
