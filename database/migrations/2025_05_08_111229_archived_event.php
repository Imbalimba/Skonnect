<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
public function up()
{
    Schema::create('archived_events', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('event_id');
        $table->text('archive_reason')->nullable();
        $table->timestamp('archived_at')->useCurrent(); // Changed to archived_at for Laravel convention
        $table->timestamps();

        // Foreign key constraint
        $table->foreign('event_id')
              ->references('id')
              ->on('eventmanage')
              ->onDelete('cascade');
    });
}

    public function down(): void
    {
        Schema::dropIfExists('archived_events');
    }
};
