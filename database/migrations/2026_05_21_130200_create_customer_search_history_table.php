<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_search_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_profile_id')->constrained()->cascadeOnDelete();
            $table->string('keyword');
            $table->timestamp('searched_at')->useCurrent();

            // Recent-first lookups per customer + dedupe by keyword.
            $table->index(['customer_profile_id', 'searched_at']);
            $table->index(['customer_profile_id', 'keyword']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_search_history');
    }
};
