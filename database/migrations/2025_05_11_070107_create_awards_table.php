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
        Schema::create('awards', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->string('category');
            $table->string('recipients');
            $table->date('date_awarded');
            $table->string('main_image');
            $table->json('media')->nullable(); // Renamed from 'gallery' to 'media' - stores images and videos with captions
            $table->integer('year');
            $table->enum('status', ['published', 'archived'])->default('published');
            $table->enum('sk_station', [
                'Federation', 
                'Dela Paz', 
                'Manggahan', 
                'Maybunga', 
                'Pinagbuhatan', 
                'Rosario', 
                'San Miguel',
                'Santa Lucia', 
                'Santolan'
            ]);
            $table->unsignedBigInteger('created_by');
            $table->foreign('created_by')->references('id')->on('skaccounts');
            // New field for tracking who updated the award
            $table->foreignId('updated_by')->nullable()->constrained('skaccounts')->onDelete('set null');
            $table->integer('view_count')->default(0); // Keep track for internal metrics, but not displayed in UI
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('awards');
    }
};