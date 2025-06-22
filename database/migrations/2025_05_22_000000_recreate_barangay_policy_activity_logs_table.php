<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop the old table
        Schema::dropIfExists('barangay_policy_activity_logs');

        // Create the new table with correct foreign key settings
        Schema::create('barangay_policy_activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sk_account_id')->constrained('skaccounts')->onDelete('cascade');
            $table->foreignId('barangay_policy_id')->nullable()->constrained('barangay_policies')->onDelete('set null');
            $table->string('activity_type'); // create, edit, delete, archive, restore
            $table->string('action');
            $table->json('details')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        // Drop the new table
        Schema::dropIfExists('barangay_policy_activity_logs');

        // Recreate the old table with cascade delete
        Schema::create('barangay_policy_activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sk_account_id')->constrained('skaccounts')->onDelete('cascade');
            $table->foreignId('barangay_policy_id')->constrained('barangay_policies')->onDelete('cascade');
            $table->string('activity_type');
            $table->string('action');
            $table->json('details')->nullable();
            $table->timestamps();
        });
    }
}; 