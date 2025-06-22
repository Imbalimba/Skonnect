<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateProjectMonitoringTable extends Migration
{
    public function up()
    {
        Schema::create('project_monitoring', function (Blueprint $table) {
            $table->id();
            $table->string('ppas');
            $table->text('description');
            $table->text('expected_output');
            $table->string('performance_target');
            $table->string('period_implementation_start');
            $table->string('period_implementation_end');
            $table->decimal('total_budget', 10, 2);
            $table->string('person_responsible');
            $table->string('center_of_participation');
            $table->string('barangay')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('project_monitoring');
    }
}
