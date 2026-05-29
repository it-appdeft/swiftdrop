<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->unsignedTinyInteger('application_step')->default(1)->after('vat_number');
            $table->json('application_data')->nullable()->after('application_step');
            $table->json('application_documents')->nullable()->after('application_data');
            $table->timestamp('application_submitted_at')->nullable()->after('application_documents');
        });
    }

    public function down(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropColumn([
                'application_step',
                'application_data',
                'application_documents',
                'application_submitted_at',
            ]);
        });
    }
};
