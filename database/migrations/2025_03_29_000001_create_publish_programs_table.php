<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('publish_programs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('project_monitoring')->onDelete('cascade');
            $table->string('barangay');
            $table->dateTime('time_start');
            $table->dateTime('time_end');
            $table->text('description');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('publish_programs');
    }
};
