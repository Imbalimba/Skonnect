<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Profile extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array   
     */
    protected $fillable = [
        // Base personal information
        'account_id',
        'first_name',
        'middle_name',
        'last_name',
        'gender',
        'birthdate',
        'age',
        'address',
        'barangay',
        'email',
        'phone_number',
        
        // Youth Classification Fields
        'civil_status',
        'youth_classification',
        'youth_needs',
        'youth_age_group',
        'educational_background',
        'work_status',
        
        // Voting and Assembly Participation
        'sk_voter',
        'national_voter',
        'kk_assembly_attendance',
        'did_vote_last_election',
        'kk_assembly_attendance_times',
        'reason_for_not_attending',
        
        // Family and Personal Status
        'soloparent',
        'num_of_children',
        
        // Persons with Disabilities (PWD) Fields
        'pwd',
        'pwd_years',
        
        // Athlete Fields
        'athlete',
        'sport_name',
        
        // Scholarship Fields
        'scholar',
        'pasigscholar',
        'scholarship_name',
        'studying_level',
        'yearlevel',
        'school_name',
        
        // Employment Fields
        'working_status',
        'company_name',
        'position_name',
        'licensed_professional',
        'employment_yrs',
        'monthly_income',
        
        // Youth Organization and Additional Details
        'youth_org',
        'org_name',
        'org_position',
        'lgbtqia_member',
        'osyranking'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'birthdate' => 'date',
       
    ];

    /**
     * Relationship with Account model
     */
    public function account()
    {
        return $this->belongsTo(Account::class, 'account_id');
    }

    /**
     * Get the full name of the profile
     *
     * @return string
     */
    public function getFullNameAttribute()
    {
        return trim("{$this->first_name} " . 
            ($this->middle_name ? $this->middle_name . ' ' : '') . 
            $this->last_name);
    }

    /**
     * Scope a query to find profiles by email
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  string  $email
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeFindByEmail($query, $email)
    {
        return $query->where('email', $email);
    }

    /**
     * Calculate age based on birthdate
     *
     * @return int|null
     */
    public function calculateAge()
    {
        return $this->birthdate ? $this->birthdate->age : null;
    }

    /**
     * Get the archived record associated with the profile.
     */
    public function archivedRecord()
    {
        return $this->hasOne(ArchivedProfile::class, 'profile_id');
    }

    /**
     * Check if the profile is archived.
     */
    public function isArchived()
    {
        return $this->archivedRecord()->exists();
    }
}