<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Replace the JSON-blob partner-application columns with a normalized schema
 * that mirrors the on-screen steps:
 *
 *   Step 1 (Restaurant)    → columns on the `restaurants` table itself.
 *   Step 2 (Legal & Bank)  → `restaurant_legal_and_bank` (1-to-1).
 *   Step 3 (Documents)     → `restaurant_documents`     (1-to-1, six paths).
 *   Step 4 (Review)        → state columns on `restaurants` (no separate table).
 *
 * Operational columns (status, approval_status, rating, commission_rate, etc.)
 * are intentionally retained — they're not part of the application form but
 * are needed for the restaurant's lifecycle after approval.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            // Drop the JSON-blob columns added by the earlier draft migration.
            $table->dropColumn([
                'application_step',
                'application_data',
                'application_documents',
                'application_submitted_at',
            ]);
        });

        Schema::table('restaurants', function (Blueprint $table) {
            // Drop legacy address / single-cuisine columns now collected via
            // the partner application's Step 1 fields below.
            $table->dropColumn([
                'address_line_1',
                'address_line_2',
                'city',
                'county',
                'postcode',
                'phone',
                'cuisine_type',
                'vat_number',
            ]);
        });

        Schema::table('restaurants', function (Blueprint $table) {
            // Step 1 — Restaurant details.
            $table->string('legal_business_name', 200)->nullable()->after('name');
            $table->string('owner_name', 100)->nullable()->after('legal_business_name');
            $table->string('owner_email', 255)->nullable()->after('owner_name');
            $table->string('owner_mobile', 20)->nullable()->after('owner_email');
            $table->string('restaurant_type', 50)->nullable()->after('owner_mobile');
            $table->string('cuisines', 500)->nullable()->after('restaurant_type');
            $table->unsignedSmallInteger('branches')->nullable()->after('cuisines');
            $table->unsignedSmallInteger('seating_capacity')->nullable()->after('branches');
            $table->text('full_address')->nullable()->after('seating_capacity');
            // lat / lng already exist — leave them.

            // Application progress state.
            $table->unsignedTinyInteger('application_step')->default(1)->after('approval_status');
            $table->timestamp('terms_accepted_at')->nullable()->after('application_step');
            $table->timestamp('application_submitted_at')->nullable()->after('terms_accepted_at');

            // Indexes for admin filtering / lookup hotspots.
            $table->index('application_submitted_at');
            $table->index('approval_status');
            $table->index('owner_email');
        });

        Schema::create('restaurant_legal_and_bank', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')
                ->unique()
                ->constrained('restaurants')
                ->cascadeOnDelete();

            // Legal identifiers.
            $table->string('gst_number', 15)->nullable();
            $table->string('fssai_license', 14)->nullable();
            $table->string('pan_number', 10)->nullable();

            // Banking — optional during draft, required only at submit.
            $table->string('account_holder_name', 200)->nullable();
            $table->string('bank_name', 200)->nullable();
            $table->string('account_number', 50)->nullable();
            $table->string('ifsc_code', 20)->nullable();

            $table->timestamps();

            // Lookup indexes — these IDs are heavily used in compliance views.
            $table->index('gst_number');
            $table->index('pan_number');
            $table->index('fssai_license');
        });

        Schema::create('restaurant_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')
                ->unique()
                ->constrained('restaurants')
                ->cascadeOnDelete();

            // Each path stores a relative location under the `public` disk.
            // Original filenames are intentionally NOT stored — they leak PII
            // and aren't needed once the file is on disk.
            $table->string('gst_certificate_path')->nullable();
            $table->string('fssai_license_path')->nullable();
            $table->string('pan_card_path')->nullable();
            $table->string('cancelled_cheque_path')->nullable();
            $table->string('owner_id_proof_path')->nullable();
            $table->string('menu_path')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurant_documents');
        Schema::dropIfExists('restaurant_legal_and_bank');

        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropIndex(['application_submitted_at']);
            $table->dropIndex(['approval_status']);
            $table->dropIndex(['owner_email']);

            $table->dropColumn([
                'legal_business_name',
                'owner_name',
                'owner_email',
                'owner_mobile',
                'restaurant_type',
                'cuisines',
                'branches',
                'seating_capacity',
                'full_address',
                'application_step',
                'terms_accepted_at',
                'application_submitted_at',
            ]);

            // Restore legacy columns as nullable (cheapest reversal).
            $table->string('address_line_1')->nullable();
            $table->string('address_line_2')->nullable();
            $table->string('city')->nullable();
            $table->string('county')->nullable();
            $table->string('postcode', 10)->nullable();
            $table->string('phone')->nullable();
            $table->string('cuisine_type')->nullable();
            $table->string('vat_number')->nullable();

            $table->unsignedTinyInteger('application_step')->default(1);
            $table->json('application_data')->nullable();
            $table->json('application_documents')->nullable();
            $table->timestamp('application_submitted_at_legacy')->nullable();
        });
    }
};
