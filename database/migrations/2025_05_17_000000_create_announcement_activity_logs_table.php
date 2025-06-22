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
        Schema::create('announcement_activity_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sk_account_id');
            $table->unsignedBigInteger('announcement_id');
            $table->enum('activity_type', [
                'create',
                'edit',
                'archive',
                'restore',
                'delete',
                'view'
            ]);
            $table->string('action');
            $table->text('details')->nullable();
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('sk_account_id')->references('id')->on('skaccounts')->onDelete('cascade');
            $table->foreign('announcement_id')->references('id')->on('announcements')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('announcement_activity_logs');
    }
}; 