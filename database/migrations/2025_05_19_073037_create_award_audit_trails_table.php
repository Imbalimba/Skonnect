<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('award_audit_trails', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('award_id')->nullable(); // Can be null for deleted awards
            $table->string('award_title')->nullable(); // Store title to preserve it even if award is deleted
            $table->string('action'); // 'create', 'update', 'archive', 'restore', 'delete'
            $table->unsignedBigInteger('user_id'); // ID of the SK user who performed the action
            $table->string('user_name')->nullable(); // Store the name to preserve it even if user record changes
            $table->text('details')->nullable(); // JSON encoded details about the change
            $table->timestamps();
            
            // Foreign key with set null on delete to keep audit records even if award is deleted
            $table->foreign('award_id')->references('id')->on('awards')->onDelete('set null');
            $table->foreign('user_id')->references('id')->on('skaccounts')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('award_audit_trails');
    }
};