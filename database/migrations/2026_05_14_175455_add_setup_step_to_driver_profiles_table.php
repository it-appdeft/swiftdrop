<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('driver_profiles', function (Blueprint $table) {
            // 0 = not started, 1 = bank done, 2 = vehicle done, 3 = documents done (submitted).
            // Tracks the highest step the driver has completed; never moves backwards.
            $table->unsignedTinyInteger('setup_step')->default(0)->after('approval_status');
        });
    }

    public function down(): void
    {
        Schema::table('driver_profiles', function (Blueprint $table) {
            $table->dropColumn('setup_step');
        });
    }
};
