<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('program_applicants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('publish_program_id')->constrained('publish_programs')->onDelete('cascade');
            $table->string('firstname');
            $table->string('middlename')->nullable();
            $table->string('lastname');
            $table->string('barangay');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('program_applicants');
    }
};
