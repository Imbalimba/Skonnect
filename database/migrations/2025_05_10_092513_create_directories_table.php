
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
        Schema::create('directories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('role');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('location')->nullable();
            $table->string('category');
            $table->foreignId('created_by')->constrained('skaccounts');
            $table->foreignId('updated_by')->nullable()->constrained('skaccounts')->onDelete('set null');
            $table->enum('sk_station', ['Federation', 'Dela Paz', 'Manggahan', 'Maybunga', 'Pinagbuhatan', 'Rosario', 'San Miguel', 'Santa Lucia', 'Santolan']);
            $table->enum('status', ['published', 'archived'])->default('published');
            
            // Only keep these organizational chart fields
            $table->integer('position_order')->default(999); // Lower numbers = higher in hierarchy
            $table->foreignId('reports_to')->nullable(); // Direct supervisor relationship
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('directories');
    }
};