<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The 8-step onboarding flow is being merged into the partner application.
 * Drop the temporary onboarding-tracking columns — `application_step` (now
 * 1–8) and `application_submitted_at` already serve the same purpose.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            if (Schema::hasColumn('restaurants', 'onboarding_completed_at')) {
                $table->dropIndex(['onboarding_completed_at']);
                $table->dropColumn('onboarding_completed_at');
            }
            if (Schema::hasColumn('restaurants', 'onboarding_step')) {
                $table->dropColumn('onboarding_step');
            }
        });
    }

    public function down(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->unsignedTinyInteger('onboarding_step')->default(1);
            $table->timestamp('onboarding_completed_at')->nullable();
            $table->index('onboarding_completed_at');
        });
    }
};
