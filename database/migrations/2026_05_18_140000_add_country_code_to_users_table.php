<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Country dialling codes we know how to split out of legacy canonical
     * mobiles (e.g. "+447789000002"). Anything outside this list keeps the
     * full E.164 string in `mobile` with a null `country_code` — those rows
     * will be normalised the next time the user updates their number.
     */
    private array $knownPrefixes = ['+44', '+91', '+1', '+234'];

    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('country_code', 8)->nullable()->after('mobile');
        });

        $this->backfillExistingMobiles();

        Schema::table('users', function (Blueprint $table) {
            // Drop the mobile-only unique now that mobile holds the local
            // part — two users in different countries can legitimately
            // share the same digit string.
            $table->dropUnique('users_mobile_unique');
            $table->unique(['country_code', 'mobile']);
        });
    }

    public function down(): void
    {
        // Glue country_code + mobile back together so the column means the
        // same thing as before this migration ran.
        foreach (DB::table('users')->whereNotNull('country_code')->get() as $row) {
            DB::table('users')->where('id', $row->id)->update([
                'mobile' => $row->country_code.$row->mobile,
            ]);
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['country_code', 'mobile']);
            $table->unique('mobile');
            $table->dropColumn('country_code');
        });
    }

    /**
     * For every existing canonical mobile ("+44...") whose prefix matches
     * a known dialling code, peel the code off into `country_code` and
     * leave only the subscriber digits in `mobile`.
     */
    private function backfillExistingMobiles(): void
    {
        // Order longest-first so "+44" wins over "+4" if both were ever in
        // the list. Keeps the loop deterministic.
        $prefixes = $this->knownPrefixes;
        usort($prefixes, fn ($a, $b) => strlen($b) <=> strlen($a));

        foreach (DB::table('users')->whereNotNull('mobile')->cursor() as $row) {
            $mobile = (string) $row->mobile;

            if (! str_starts_with($mobile, '+')) {
                continue;
            }

            foreach ($prefixes as $prefix) {
                if (str_starts_with($mobile, $prefix)) {
                    DB::table('users')->where('id', $row->id)->update([
                        'country_code' => $prefix,
                        'mobile' => substr($mobile, strlen($prefix)),
                    ]);
                    break;
                }
            }
        }
    }
};
