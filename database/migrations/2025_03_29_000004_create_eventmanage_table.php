<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('eventmanage', function (Blueprint $table) {
            $table->id();
            $table->string('event');
            $table->dateTime('timeframe');
            $table->string('location');
            $table->text('description');
            $table->timestamp('created_on')->useCurrent();
            $table->enum('status', ['ongoing', 'upcoming', 'completed'])->default('upcoming');
            $table->string('barangay');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('eventmanage');
    }
};
