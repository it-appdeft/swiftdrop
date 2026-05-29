<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('driver_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('profile_photo')->nullable();
            $table->enum('vehicle_type', ['bicycle', 'motorcycle', 'car', 'van']);
            $table->string('vehicle_make')->nullable();
            $table->string('vehicle_model')->nullable();
            $table->string('vehicle_registration');
            $table->enum('availability', ['online', 'offline'])->default('offline');
            $table->enum('approval_status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->decimal('current_lat', 10, 8)->nullable();
            $table->decimal('current_lng', 11, 8)->nullable();
            $table->timestamps();
        });

        Schema::create('restaurants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('address_line_1');
            $table->string('address_line_2')->nullable();
            $table->string('city');
            $table->string('county')->nullable();
            $table->string('postcode', 10);
            $table->decimal('lat', 10, 8);
            $table->decimal('lng', 11, 8);
            $table->string('phone');
            $table->string('cuisine_type')->nullable();
            $table->string('logo_path')->nullable();
            $table->string('cover_photo_path')->nullable();
            $table->enum('status', ['pending_approval', 'active', 'inactive', 'suspended'])->default('pending_approval');
            $table->enum('approval_status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->decimal('rating', 3, 2)->default(0.00);
            $table->unsignedInteger('total_reviews')->default(0);
            $table->decimal('commission_rate', 5, 2)->default(10.00);
            $table->string('vat_number')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurants');
        Schema::dropIfExists('driver_profiles');
    }
};
