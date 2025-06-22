<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('event_attendees', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('publish_event_id');
            $table->unsignedBigInteger('profile_id');
            $table->string('first_name')->nullable();;
            $table->string('middle_name')->nullable();
            $table->string('last_name')->nullable();;
            $table->string('attendees_email'); // Add this
            $table->enum('is_volunteer', ['yes', 'no'])->default('no'); // Add this
            $table->string('status')->default('invited');
            $table->timestamps();

            $table->foreign('publish_event_id')
                ->references('id')
                ->on('publish_events')
                ->onDelete('cascade');

            $table->foreign('profile_id')
                ->references('id')
                ->on('profiles')
                ->onDelete('cascade');

            $table->unique(['publish_event_id', 'profile_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('event_attendees');
    }
};
