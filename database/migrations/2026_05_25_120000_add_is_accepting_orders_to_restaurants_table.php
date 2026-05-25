<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Partner-controlled "accepting orders" switch. Distinct from approval/status:
 * a restaurant must be admin-approved before it can turn this on, and it lets
 * an approved restaurant pause incoming orders without going inactive.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->boolean('is_accepting_orders')->default(false)->after('approval_status');
        });
    }

    public function down(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropColumn('is_accepting_orders');
        });
    }
};
