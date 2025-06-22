<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('registered_attendees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('publish_event_id')->constrained('publish_events')->onDelete('cascade');
            $table->foreignId('account_id')->constrained('accounts')->onDelete('cascade');
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->string('barangay');
            $table->enum('attendee_type', ['participant', 'volunteer']);
            $table->unsignedBigInteger('eventmanage_id')->nullable();
            $table->string('event_name')->nullable();
            $table->foreign('eventmanage_id')->references('id')->on('eventmanage')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('registered_attendees');
    }
};
