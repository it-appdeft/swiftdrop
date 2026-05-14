<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('driver_profiles', function (Blueprint $table) {
            $table->date('date_of_birth')->nullable()->after('profile_photo');

            $table->string('vehicle_color')->nullable()->after('vehicle_registration');
            $table->unsignedSmallInteger('year_of_manufacture')->nullable()->after('vehicle_color');
            $table->enum('insurance_type', ['comprehensive', 'third_party', 'third_party_fire_theft'])
                ->nullable()
                ->after('year_of_manufacture');
            $table->date('insurance_expiry_date')->nullable()->after('insurance_type');
            $table->date('mot_expiry_date')->nullable()->after('insurance_expiry_date');

            $table->string('account_holder_name')->nullable()->after('mot_expiry_date');
            $table->string('account_number')->nullable()->after('account_holder_name');
            $table->string('sort_code', 20)->nullable()->after('account_number');
            $table->string('bank_name')->nullable()->after('sort_code');

            $table->boolean('notify_delivery_updates')->default(true)->after('bank_name');
            $table->boolean('notify_general')->default(true)->after('notify_delivery_updates');
        });
    }

    public function down(): void
    {
        Schema::table('driver_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'date_of_birth',
                'vehicle_color',
                'year_of_manufacture',
                'insurance_type',
                'insurance_expiry_date',
                'mot_expiry_date',
                'account_holder_name',
                'account_number',
                'sort_code',
                'bank_name',
                'notify_delivery_updates',
                'notify_general',
            ]);
        });
    }
};
