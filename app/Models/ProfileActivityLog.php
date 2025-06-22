<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProfileActivityLog extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'profile_id',
        'sk_account_id',
        'activity_type',
        'action',
        'details'
    ];

    protected $casts = [
        'details' => 'array'
    ];

    /**
     * Get the SK account that performed the action.
     */
    public function skAccount()
    {
        return $this->belongsTo(SkAccount::class);
    }

    /**
     * Get the profile that was acted upon.
     */
    public function profile()
    {
        return $this->belongsTo(Profile::class);
    }

    /**
     * Get the profile name from details if profile is deleted
     */
    public function getProfileNameAttribute()
    {
        if ($this->profile) {
            return $this->profile->first_name . ' ' . $this->profile->last_name;
        }

        // If profile is deleted, try to get name from details
        if ($this->details) {
            $details = json_decode($this->details, true);
            if (isset($details['first_name']) && isset($details['last_name'])) {
                return $details['first_name'] . ' ' . $details['last_name'];
            }
        }

        return 'Deleted Profile';
    }

    /**
     * Get the profile barangay from details if profile is deleted
     */
    public function getProfileBarangayAttribute()
    {
        if ($this->profile) {
            return $this->profile->barangay;
        }

        // If profile is deleted, try to get barangay from details
        if ($this->details) {
            $details = json_decode($this->details, true);
            if (isset($details['barangay'])) {
                return $details['barangay'];
            }
        }

        return 'N/A';
    }
} 