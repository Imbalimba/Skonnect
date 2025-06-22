<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('verification_codes', function (Blueprint $table) {
            $table->id();
            $table->string('email');
            $table->string('code');
            $table->enum('type', ['youth', 'sk', 'youth_reset', 'sk_reset', 'sk_2fa'])->comment('User type: youth or sk');
            $table->timestamp('expires_at');
            $table->timestamps();
            
            // Add a unique constraint to ensure one active code per email and type
            $table->unique(['email', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('verification_codes');
    }
};