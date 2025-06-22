<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('archived_profiles', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('profile_id'); // Foreign key to profiles table
            $table->text('archive_reason')->nullable();
            $table->timestamp('archived_date');
            $table->timestamps();

            // Foreign key constraint
            $table->foreign('profile_id')
                  ->references('id')
                  ->on('profiles')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('archived_profiles');
    }
};