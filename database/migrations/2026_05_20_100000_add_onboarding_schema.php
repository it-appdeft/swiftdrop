<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Schema for the 8-step partner onboarding flow that runs after the partner
 * application is approved. Reuses `restaurants`, `restaurant_legal_and_bank`,
 * and `restaurant_documents` from the application phase; adds new tables for
 * data that didn't exist before.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            // Step 1 — Basic info adds a tagline alongside the name.
            $table->string('tagline', 255)->nullable()->after('legal_business_name');
            // Resume cursor for the onboarding flow (mirrors application_step).
            $table->unsignedTinyInteger('onboarding_step')->default(1)->after('application_submitted_at');
        });

        // Step 3 — Cuisine & service capabilities.
        Schema::create('restaurant_service_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')
                ->unique()
                ->constrained('restaurants')
                ->cascadeOnDelete();
            $table->unsignedTinyInteger('delivery_radius_km')->nullable();
            $table->unsignedSmallInteger('avg_prep_time_min')->nullable();
            $table->decimal('min_order_amount', 10, 2)->nullable();
            $table->decimal('avg_ticket_size', 10, 2)->nullable();
            $table->timestamps();
        });

        // Step 4 — Operating hours. One row per day per restaurant.
        Schema::create('restaurant_hours', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained('restaurants')->cascadeOnDelete();
            $table->enum('day_of_week', ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
            $table->boolean('is_open')->default(true);
            $table->time('open_from')->nullable();
            $table->time('open_to')->nullable();
            $table->timestamps();

            $table->unique(['restaurant_id', 'day_of_week']);
        });

        // Step 5 — Delivery & orders operational settings.
        Schema::create('restaurant_delivery_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')
                ->unique()
                ->constrained('restaurants')
                ->cascadeOnDelete();
            $table->boolean('auto_accept_orders')->default(true);
            $table->unsignedSmallInteger('estimated_prep_time_min')->nullable();
            $table->decimal('packaging_charges', 10, 2)->nullable();
            $table->string('tax_type', 50)->nullable();
            $table->unsignedSmallInteger('cancellation_cutoff_min')->nullable();
            $table->timestamps();
        });

        // Step 2 — Branding gallery (up to 8 images, ordered).
        Schema::create('restaurant_gallery_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained('restaurants')->cascadeOnDelete();
            $table->string('image_path', 500);
            $table->unsignedTinyInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['restaurant_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurant_gallery_images');
        Schema::dropIfExists('restaurant_delivery_settings');
        Schema::dropIfExists('restaurant_hours');
        Schema::dropIfExists('restaurant_service_settings');

        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropColumn(['tagline', 'onboarding_step']);
        });
    }
};
