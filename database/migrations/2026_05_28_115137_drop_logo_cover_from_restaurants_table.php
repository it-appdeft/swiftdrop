<?php

use App\Models\Restaurant;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Restaurant logo + banner now live in the polymorphic `uploads` table
     * (collections 'logo' / 'banner'), so these columns are redundant.
     */
    public function up(): void
    {
        $this->preserveExistingPaths();

        Schema::table('restaurants', function (Blueprint $table) {
            foreach (['logo_path', 'cover_photo_path'] as $column) {
                if (Schema::hasColumn('restaurants', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }

    /** Carry any existing column values over to uploads rows so live data survives the drop. */
    protected function preserveExistingPaths(): void
    {
        if (! Schema::hasColumn('restaurants', 'logo_path') && ! Schema::hasColumn('restaurants', 'cover_photo_path')) {
            return;
        }

        $map = ['logo_path' => Restaurant::LOGO_COLLECTION, 'cover_photo_path' => Restaurant::BANNER_COLLECTION];

        DB::table('restaurants')->select('id', 'logo_path', 'cover_photo_path')->orderBy('id')->each(function ($r) use ($map) {
            foreach ($map as $column => $collection) {
                $path = $r->{$column} ?? null;
                if (! $path) {
                    continue;
                }

                $already = DB::table('uploads')
                    ->where('model_type', Restaurant::class)
                    ->where('model_id', $r->id)
                    ->where('collection', $collection)
                    ->exists();

                if ($already) {
                    continue;
                }

                DB::table('uploads')->insert([
                    'model_type' => Restaurant::class,
                    'model_id' => $r->id,
                    'collection' => $collection,
                    'file' => ltrim((string) $path, '/'),
                    'disk' => 'public',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            if (! Schema::hasColumn('restaurants', 'logo_path')) {
                $table->string('logo_path')->nullable();
            }
            if (! Schema::hasColumn('restaurants', 'cover_photo_path')) {
                $table->string('cover_photo_path')->nullable();
            }
        });
    }
};
