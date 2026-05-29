<?php

use App\Models\User;
use App\Support\Countries;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Adds an ISO 3166-1 alpha-2 country code ("GB", "IN") alongside the
     * dialling prefix. The prefix alone is ambiguous — +44 covers GB / JE /
     * GG / IM and +1 covers US / CA — so the ISO is what lets the frontend
     * resolve one exact flag. Nullable: backfilled best-effort below, then
     * populated on the user's next registration / number update.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('country_iso', 2)->nullable()->after('country_code');
        });

        $this->backfillCountryIso();
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('country_iso');
        });
    }

    /**
     * Derive an ISO for existing rows from whatever dialling code we can find:
     * the explicit country_code on normalised rows, or the prefix peeled out of
     * a legacy canonical mobile ("+447…") on un-normalised ones.
     */
    private function backfillCountryIso(): void
    {
        foreach (DB::table('users')->whereNull('country_iso')->cursor() as $row) {
            $dial = $row->country_code;

            // Un-normalised legacy rows keep the full E.164 in `mobile` with a
            // null country_code — peel the known prefix off to recover the dial.
            if (($dial === null || $dial === '') && $row->mobile) {
                [$dial] = User::splitCanonicalMobile((string) $row->mobile);
            }

            $iso = Countries::primaryIsoForDial($dial);

            if ($iso !== null) {
                DB::table('users')->where('id', $row->id)->update(['country_iso' => $iso]);
            }
        }
    }
};
