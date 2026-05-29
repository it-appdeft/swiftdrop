<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Generic polymorphic attachments table.
 *
 * One row per stored file (image / PDF / any attachment), owned by any
 * model through the `model_type` + `model_id` morph. A `collection` tag
 * groups files by purpose on the same owner (e.g. a menu item's "image"
 * vs "gallery"). Used first by Menu Management, reusable everywhere.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('uploads', function (Blueprint $table) {
            $table->id();
            // Owning model — nullable so a file can be uploaded first and
            // attached afterwards. ("model_id" is the requested column.)
            $table->nullableMorphs('model');
            // Optional grouping bucket on the owner, e.g. 'image', 'gallery',
            // 'document'. Null = ungrouped.
            $table->string('collection')->nullable();
            // Stored path (relative to the disk) + the disk it lives on.
            $table->string('file');
            $table->string('disk')->default('public');
            // Original upload metadata — handy for downloads + validation.
            $table->string('original_name')->nullable();
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('size')->nullable(); // bytes
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['model_type', 'model_id', 'collection']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('uploads');
    }
};
