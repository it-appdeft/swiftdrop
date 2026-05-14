<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('driver_profiles', function (Blueprint $table) {
             $table->enum('vehicle_type', [
                'bicycle',
                'motorcycle',
                'car',
                'van'
            ])->nullable()->change();

            $table->string('vehicle_registration')
                ->nullable()
                ->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('driver_profiles', function (Blueprint $table) {
             $table->enum('vehicle_type', [
                'bicycle',
                'motorcycle',
                'car',
                'van'
            ])->nullable(false)->change();

            $table->string('vehicle_registration')
                ->nullable(false)
                ->change();
        });
    }
};
