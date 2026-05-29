<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Replace the enum `vehicle_type` column with a string that references
     * the new `vehicle_types.slug`. Old enum values are remapped to the new
     * slugs so existing seeded rows survive.
     */
    public function up(): void
    {
        Schema::table('driver_profiles', function (Blueprint $table) {
            $table->string('vehicle_type', 64)->nullable()->change();
        });

        DB::table('driver_profiles')->where('vehicle_type', 'motorcycle')->update(['vehicle_type' => 'motor_bike']);
        DB::table('driver_profiles')->where('vehicle_type', 'car')->update(['vehicle_type' => 'four_wheeler']);
        DB::table('driver_profiles')->where('vehicle_type', 'van')->update(['vehicle_type' => 'four_wheeler']);
    }

    public function down(): void
    {
        DB::table('driver_profiles')->where('vehicle_type', 'motor_bike')->update(['vehicle_type' => 'motorcycle']);
        DB::table('driver_profiles')->where('vehicle_type', 'three_wheeler')->update(['vehicle_type' => 'motorcycle']);
        DB::table('driver_profiles')->where('vehicle_type', 'four_wheeler')->update(['vehicle_type' => 'car']);

        Schema::table('driver_profiles', function (Blueprint $table) {
            $table->enum('vehicle_type', ['bicycle', 'motorcycle', 'car', 'van'])->nullable()->change();
        });
    }
};
