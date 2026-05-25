<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Surface the existing `offers` table to customers as "Coupons": a display
 * title + description for the coupon card, and a `trigger` that gates
 * availability beyond the generic min-order/date rules:
 *   - all     → always available (subject to min order + validity)
 *   - welcome → only for a customer's first N orders (N = max_uses_per_user)
 *   - weekend → only valid on Sat/Sun
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('offers', function (Blueprint $table) {
            $table->string('title')->nullable()->after('code');
            $table->string('description')->nullable()->after('title');
            $table->string('trigger', 16)->default('all')->after('applicable_id');
        });
    }

    public function down(): void
    {
        Schema::table('offers', function (Blueprint $table) {
            $table->dropColumn(['title', 'description', 'trigger']);
        });
    }
};
