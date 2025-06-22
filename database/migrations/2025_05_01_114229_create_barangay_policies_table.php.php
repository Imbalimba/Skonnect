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
        Schema::create('barangay_policies', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->enum('category', ['Barangay Resolution']); // Only resolutions allowed
            $table->string('file_path');
            $table->integer('year');
            $table->string('barangay'); // To track which barangay created this
            $table->boolean('archived')->default(false);
            $table->text('archive_reason')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
            
            // Index for better performance when filtering by barangay
            $table->index('barangay');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('barangay_policies');
    }
};