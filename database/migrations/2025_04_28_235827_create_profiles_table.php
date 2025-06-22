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
        // If the table exists, add the account_id column if it doesn't already exist
        if (Schema::hasTable('profiles') && !Schema::hasColumn('profiles', 'account_id')) {
            Schema::table('profiles', function (Blueprint $table) {
                $table->unsignedBigInteger('account_id')->nullable()->after('id');
                $table->foreign('account_id')->references('id')->on('accounts')->onDelete('set null');
            });
        } 
        // If the table doesn't exist, create it with all needed columns
        else if (!Schema::hasTable('profiles')) {
            Schema::create('profiles', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('account_id')->nullable();
                $table->foreign('account_id')->references('id')->on('accounts')->onDelete('set null');
                
                // Basic Information
                $table->string('first_name');
                $table->string('middle_name')->nullable();
                $table->string('last_name');
                $table->string('gender');
                $table->date('birthdate');
                $table->integer('age');
                $table->string('address');
                $table->string('barangay')->nullable();
                $table->string('email')->unique();
                $table->string('phone_number');
                
                // Demographics
                $table->string('civil_status');
                $table->string('youth_classification');
                $table->string('youth_age_group');
                $table->string('educational_background');
                $table->string('work_status');
                $table->string('sk_voter');
                $table->string('national_voter');
                $table->string('kk_assembly_attendance');
                $table->string('did_vote_last_election')->nullable();
                $table->string('kk_assembly_attendance_times')->nullable();
                $table->string('reason_for_not_attending')->nullable();
                
                // Additional Questions
                $table->string('soloparent')->nullable();
                $table->integer('num_of_children')->nullable();
                $table->string('pwd')->nullable();
                $table->integer('pwd_years')->nullable();
                $table->string('athlete')->nullable();
                $table->string('sport_name')->nullable();
                $table->string('scholar')->nullable();
                $table->string('pasigscholar')->nullable();
                $table->string('scholarship_name')->nullable();
                $table->string('studying_level')->nullable();
                $table->string('yearlevel')->nullable();
                $table->string('school_name')->nullable();
                $table->string('working_status')->nullable();
                $table->string('company_name')->nullable();
                $table->string('position_name')->nullable();
                $table->string('licensed_professional')->nullable();
                $table->integer('employment_yrs')->nullable();
                $table->string('monthly_income')->nullable();
                $table->string('youth_org')->nullable();
                $table->string('org_name')->nullable();
                $table->string('org_position')->nullable();
                $table->string('lgbtqia_member')->nullable();
                $table->text('osyranking')->nullable();
                
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // If the column exists, drop it first
        if (Schema::hasTable('profiles') && Schema::hasColumn('profiles', 'account_id')) {
            Schema::table('profiles', function (Blueprint $table) {
                $table->dropForeign(['account_id']);
                $table->dropColumn('account_id');
            });
        }
        
        Schema::dropIfExists('profiles');
    }
};