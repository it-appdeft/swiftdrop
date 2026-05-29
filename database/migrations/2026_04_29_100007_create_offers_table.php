<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('offers', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->enum('type', ['flat', 'percentage', 'free_delivery']);
            $table->decimal('value', 10, 2);
            $table->decimal('min_order_value', 10, 2)->nullable();
            $table->decimal('max_discount', 10, 2)->nullable();
            $table->enum('applicable_to', ['all', 'restaurant', 'category', 'item'])->default('all');
            $table->unsignedBigInteger('applicable_id')->nullable();
            $table->unsignedInteger('max_uses')->nullable();
            $table->unsignedInteger('max_uses_per_user')->nullable();
            $table->timestamp('valid_from')->nullable();
            $table->timestamp('valid_until')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('offers');
    }
};
