<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('directory_audit_trails', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('directory_id')->nullable(); // Can be null for deleted directories
            $table->string('directory_name')->nullable(); // Store name to preserve it even if directory is deleted
            $table->string('action'); // 'create', 'update', 'archive', 'restore', 'delete'
            $table->unsignedBigInteger('user_id')->nullable(); // ID of the SK user who performed the action
            $table->string('user_name')->nullable(); // Store the name to preserve it even if user record changes
            $table->text('details')->nullable(); // JSON encoded details about the change
            $table->timestamps();
            
            // Foreign key with set null on delete to keep audit records even if directory is deleted
            $table->foreign('directory_id')->references('id')->on('directories')->onDelete('set null');
            $table->foreign('user_id')->references('id')->on('skaccounts')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::dropIfExists('directory_audit_trails');
    }
};