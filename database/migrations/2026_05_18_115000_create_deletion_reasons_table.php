<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deletion_reasons', function (Blueprint $table) {
            $table->id();
            // Which role this reason is offered to. Matches UserRoleEnum
            // values (customer, driver, restaurant_owner) so the same row
            // doubles as a deletion option for that role's app.
            $table->string('role');
            $table->string('label');
            // Slug lets the app branch on a stable identifier (e.g. "other"
            // to show a free-text input) without depending on label copy.
            $table->string('slug')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['role', 'is_active', 'sort_order']);
            $table->unique(['role', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deletion_reasons');
    }
};
