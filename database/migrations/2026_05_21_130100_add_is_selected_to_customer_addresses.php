<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customer_addresses', function (Blueprint $table) {
            $table->boolean('is_selected')->default(false)->after('is_default');
        });

        // Backfill: pick exactly one address per profile to be the "selected"
        // one. Prefer the existing default, otherwise the oldest. Keeps the
        // single-selected invariant after the column is added.
        $profileIds = DB::table('customer_addresses')->distinct()->pluck('customer_profile_id');

        foreach ($profileIds as $profileId) {
            $chosen = DB::table('customer_addresses')
                ->where('customer_profile_id', $profileId)
                ->orderByDesc('is_default')
                ->orderBy('id')
                ->value('id');

            if ($chosen) {
                DB::table('customer_addresses')
                    ->where('id', $chosen)
                    ->update(['is_selected' => true]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('customer_addresses', function (Blueprint $table) {
            $table->dropColumn('is_selected');
        });
    }
};
