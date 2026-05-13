<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('otp_codes', function (Blueprint $table) {
            $table->dropIndex(['mobile', 'expires_at']);
            $table->renameColumn('mobile', 'mobile_or_email');
        });

        Schema::table('otp_codes', function (Blueprint $table) {
            $table->string('mobile_or_email', 255)->change();
            $table->string('channel', 16)->default('sms')->after('mobile_or_email');
            $table->index(['mobile_or_email', 'expires_at']);
        });
    }

    public function down(): void
    {
        Schema::table('otp_codes', function (Blueprint $table) {
            $table->dropIndex(['mobile_or_email', 'expires_at']);
            $table->dropColumn('channel');
            $table->renameColumn('mobile_or_email', 'mobile');
        });

        Schema::table('otp_codes', function (Blueprint $table) {
            $table->string('mobile', 20)->change();
            $table->index(['mobile', 'expires_at']);
        });
    }
};
