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
        Schema::create('authentication_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('authenticator_id');
            $table->enum('log_type', [
                'authentication', 
                'deauthentication', 
                'bulk_authentication',
                'bulk_deauthentication',
                'note'
            ])->default('authentication');
            $table->string('action');
            $table->text('details')->nullable();
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('user_id')->references('id')->on('skaccounts')->onDelete('cascade');
            $table->foreign('authenticator_id')->references('id')->on('skaccounts')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('authentication_logs');
    }
};