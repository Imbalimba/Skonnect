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
        Schema::create('program_attendees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('publish_program_id')->constrained('publish_programs')->onDelete('cascade');
            $table->foreignId('account_id')->constrained('accounts')->onDelete('cascade');
            $table->string('firstname');
            $table->string('middlename')->nullable();
            $table->string('lastname');
            $table->string('barangay');
            $table->text('reason_for_applying');
            $table->timestamps();

            // Add unique constraint to prevent duplicate registrations
            $table->unique(['publish_program_id', 'account_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('program_attendees');
    }
};
