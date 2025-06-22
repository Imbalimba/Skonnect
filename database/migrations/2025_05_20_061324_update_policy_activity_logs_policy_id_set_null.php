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
        Schema::dropIfExists('policy_activity_logs');
        Schema::create('policy_activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('policy_id')->nullable()->constrained('policies')->onDelete('set null');
            $table->foreignId('sk_account_id')->constrained('skaccounts')->onDelete('cascade');
            $table->string('activity_type');
            $table->string('action');
            $table->json('details')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('policy_activity_logs');
    }
};
