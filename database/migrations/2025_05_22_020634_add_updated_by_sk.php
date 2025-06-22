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
        Schema::table('accounts', function (Blueprint $table) {
            // Add updated_by field to track who last updated the record
            $table->unsignedBigInteger('updated_by_sk')->nullable()
                ->comment('ID of the SK user who last updated this record');
                
            // Add foreign key constraint to skaccounts table
            $table->foreign('updated_by_sk')->references('id')
                ->on('skaccounts')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropForeign(['updated_by_sk']);
            $table->dropColumn('updated_by_sk');
        });
    }
};