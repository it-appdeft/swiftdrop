<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tracks when a partner finishes the 8-step setup flow that runs after their
 * application is approved. Drives the post-login routing in
 * {@see \App\Models\User::homeRouteName()}.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->timestamp('onboarding_completed_at')
                ->nullable()
                ->after('application_submitted_at');

            $table->index('onboarding_completed_at');
        });
    }

    public function down(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropIndex(['onboarding_completed_at']);
            $table->dropColumn('onboarding_completed_at');
        });
    }
};
