<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('templates', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->enum('category', ['reports', 'forms', 'letters', 'budget', 'events']);
            $table->string('file_type'); // docx, xlsx, pptx, pdf
            $table->string('file_path'); // stored file path
            $table->string('file_size'); // e.g., '38 KB'
            $table->integer('download_count')->default(0);
            $table->enum('status', ['active', 'archived'])->default('active');
            $table->foreignId('created_by')->nullable()->constrained('skaccounts')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('skaccounts')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('templates');
    }
};