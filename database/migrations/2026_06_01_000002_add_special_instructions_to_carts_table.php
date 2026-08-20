<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            // The customer's cooking / allergy request, saved on the cart so it
            // survives across visits and can be edited any time before payment.
            $table->string('special_instructions', 300)->nullable()->after('coupon_code');
        });
    }

    public function down(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->dropColumn('special_instructions');
        });
    }
};
