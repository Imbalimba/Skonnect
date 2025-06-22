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
        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('content');
            $table->enum('visibility', ['public', 'sk_only'])->default('public');
            $table->string('barangay')->default('all'); // Add this line - 'all' means for all barangays
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->boolean('is_archived')->default(false);
            $table->string('archive_reason')->nullable();
            $table->timestamp('archived_at')->nullable();
            
            // Proper relationship to Skaccount model
            $table->foreignId('skaccount_id')->constrained('skaccounts')->onDelete('cascade');
            
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('announcements');
    }
};