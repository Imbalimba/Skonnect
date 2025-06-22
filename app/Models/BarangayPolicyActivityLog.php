<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BarangayPolicyActivityLog extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'sk_account_id',
        'barangay_policy_id',
        'activity_type',
        'action',
        'details'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'details' => 'array'
    ];

    /**
     * Get the SK account that performed the activity
     */
    public function skAccount()
    {
        return $this->belongsTo(SKAccount::class, 'sk_account_id');
    }

    /**
     * Get the barangay policy associated with the activity
     */
    public function barangayPolicy()
    {
        return $this->belongsTo(BarangayPolicy::class, 'barangay_policy_id')->withTrashed();
    }

    /**
     * Get the formatted activity type
     */
    public function getFormattedActivityTypeAttribute()
    {
        return ucwords(str_replace('_', ' ', $this->activity_type));
    }

    /**
     * Get the formatted action
     */
    public function getFormattedActionAttribute()
    {
        return ucwords(str_replace('_', ' ', $this->action));
    }

    /**
     * Get the formatted details
     */
    public function getFormattedDetailsAttribute()
    {
        if (!$this->details) {
            return null;
        }

        $details = $this->details;
        $formattedDetails = [];

        foreach ($details as $key => $value) {
            $formattedKey = ucwords(str_replace('_', ' ', $key));
            $formattedDetails[$formattedKey] = $value;
        }

        return $formattedDetails;
    }

    /**
     * Get the policy title, even if the policy is deleted
     */
    public function getPolicyTitleAttribute()
    {
        if ($this->barangayPolicy) {
            return $this->barangayPolicy->title;
        }
        return $this->details['title'] ?? 'Deleted Policy';
    }

    /**
     * Get the policy category, even if the policy is deleted
     */
    public function getPolicyCategoryAttribute()
    {
        if ($this->barangayPolicy) {
            return $this->barangayPolicy->category;
        }
        return $this->details['category'] ?? 'N/A';
    }

    /**
     * Get the policy barangay, even if the policy is deleted
     */
    public function getPolicyBarangayAttribute()
    {
        if ($this->barangayPolicy) {
            return $this->barangayPolicy->barangay;
        }
        return $this->details['barangay'] ?? 'N/A';
    }
} 