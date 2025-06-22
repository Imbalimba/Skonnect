<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('sk_user_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sk_account_id')->nullable(); // Nullable for pre-login actions
            $table->string('action'); // login, logout, signup, etc.
            $table->text('description')->nullable();
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->string('page')->nullable(); // For page visits
            $table->timestamps();
            
            $table->foreign('sk_account_id')->references('id')->on('skaccounts')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::dropIfExists('sk_user_logs');
    }
};