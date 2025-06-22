<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Carbon\Carbon;

class Skaccount extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'first_name',
        'middle_name',
        'last_name',
        'gender',
        'birthdate',
        'age',
        'email',
        'phone_number',
        'house_number',
        'street',
        'subdivision',
        'city',
        'province',
        'sk_station',
        'sk_role',
        'term_start',
        'term_end',
        'terms_served',
        'verification_status',
        'valid_id',
        'password',
        'authentication_status',
        'authenticated_at',
        'updated_by'
    ];

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array
     */
    protected $hidden = [
        'password',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'birthdate' => 'date',
        'term_start' => 'date',
        'term_end' => 'date',
        'email_verified_at' => 'datetime',
        'authenticated_at' => 'datetime',
        'password' => 'hashed',
    ];
    
    /**
     * Get the full name of the SK member.
     *
     * @return string
     */
    public function getFullNameAttribute()
    {
        return "{$this->first_name} " . ($this->middle_name ? $this->middle_name . ' ' : '') . $this->last_name;
    }
    
    /**
     * Get the full address of the SK member.
     *
     * @return string
     */
    public function getFullAddressAttribute()
    {
        $address = [];
        
        if ($this->house_number) $address[] = $this->house_number;
        if ($this->street) $address[] = $this->street;
        if ($this->subdivision) $address[] = $this->subdivision;
        if ($this->sk_station) $address[] = $this->sk_station;
        if ($this->city) $address[] = $this->city;
        if ($this->province) $address[] = $this->province;
        
        return implode(', ', $address);
    }
    
    /**
     * Determine if the user's term has expired.
     *
     * @return bool
     */
    public function isTermExpired()
    {
        if (!$this->term_end) {
            return false;
        }
        
        return Carbon::now()->gt($this->term_end);
    }
    
    /**
     * Determine if the user is too old for SK.
     *
     * @return bool
     */
    public function isOverAge()
    {
        // SK members must be below 25 years old
        return $this->age >= 25;
    }
    
    /**
     * Determine if the user is eligible to serve based on age and term limits.
     *
     * @return bool
     */
    public function isEligible()
    {
        // Check age
        if ($this->age < 15 || $this->age >= 25) {
            return false;
        }
        
        // Check term limits (max 3 consecutive terms)
        if ($this->terms_served > 3) {
            return false;
        }
        
        // Check if term has expired
        if ($this->isTermExpired()) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Get the SK user who last updated this account.
     */
    public function updatedBy()
    {
        return $this->belongsTo(Skaccount::class, 'updated_by');
    }

        /**
     * Get the user that was authenticated/rejected.
     */
    public function user()
    {
        return $this->belongsTo(Skaccount::class, 'user_id');
    }

    /**
     * Get the admin who performed the authentication/rejection.
     */
    public function authenticator()
    {
        return $this->belongsTo(Skaccount::class, 'authenticator_id');
    }
}