<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Create the youth accounts table
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->enum('gender', ['male', 'female', 'rather not say']); 
            $table->date('dob');
            $table->integer('age');
            $table->string('email')->unique();
            
            // Replace single address field with components
            $table->string('house_number')->nullable();
            $table->string('street')->nullable();
            $table->string('subdivision')->nullable();
            $table->string('baranggay');
            $table->string('city')->default('Pasig');
            $table->string('province')->default('Metro Manila');
            
            // New fields
            $table->boolean('is_pasig_resident')->default(true);
            $table->boolean('is_authenticated')->default(false);
            $table->string('proof_of_address')->nullable();
            
            $table->string('phone_number');
            
            // Verification status column
            $table->enum('verification_status', ['not_verified', 'verified'])
                ->default('not_verified')
                ->comment('Account verification status');
            
            $table->timestamp('email_verified_at')->nullable();
            $table->enum('profile_status', ['not_profiled', 'profiled'])
                ->default('not_profiled')
                ->comment('Status of account profiling');
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });

        // Create the SK accounts table with updated fields
        Schema::create('skaccounts', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->enum('gender', ['male', 'female']);
            $table->date('birthdate');
            $table->integer('age');
            $table->string('email')->unique();
            $table->string('phone_number')->nullable();
            
            // Replace single address with components
            $table->string('house_number')->nullable();
            $table->string('street')->nullable();
            $table->string('subdivision')->nullable();
            $table->string('city')->default('Pasig');
            $table->string('province')->default('Metro Manila');

            // SK-specific fields
            $table->enum('sk_station', [
                'Dela Paz', 
                'Manggahan', 
                'Maybunga', 
                'Pinagbuhatan', 
                'Rosario', 
                'San Miguel',
                'Santa Lucia', 
                'Santolan'
            ])->comment('Barangay where the SK officer is stationed');
            
            // Update roles to include Admin
            $table->enum('sk_role', [
                'Federasyon', 
                'Chairman', 
                'Kagawad',
                'Admin'
            ])->comment('Role in the Sangguniang Kabataan');
            
            // Add term fields
            $table->date('term_start')->nullable();
            $table->date('term_end')->nullable();
            $table->integer('terms_served')->default(1);
            
            $table->enum('verification_status', ['not_verified', 'verified'])
                ->default('not_verified')
                ->comment('Account verification status');
            $table->timestamp('email_verified_at')->nullable();
            $table->enum('authentication_status', ['active', 'not_active'])                 
                ->default('not_active')
                ->comment('Account authentication status');
            $table->timestamp('authenticated_at')->nullable();
            $table->string('valid_id')->nullable(); // For image upload
            $table->string('password');
            
            // Added field for tracking who updated the record
            $table->unsignedBigInteger('updated_by')->nullable()
                ->comment('ID of the SK user who last updated this record');
                
            $table->timestamps();
            
            // Add foreign key constraint - references itself because both updater and user are in skaccounts
            $table->foreign('updated_by')->references('id')
                ->on('skaccounts')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     * 
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('accounts');
        Schema::dropIfExists('skaccounts');
    }
};