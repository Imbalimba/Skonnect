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
        Schema::table('registered_attendees', function (Blueprint $table) {
            // First drop the existing boolean column
            $table->dropColumn('attended');
            
            // Add the new enum column
            $table->enum('attended', ['yes', 'no'])->default('no')->after('attendee_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('registered_attendees', function (Blueprint $table) {
            // Drop the enum column
            $table->dropColumn('attended');
            
            // Add back the boolean column
            $table->boolean('attended')->default(false)->after('attendee_type');
        });
    }
}; 