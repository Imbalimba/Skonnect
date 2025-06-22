<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PolicyActivityLog extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'policy_id',
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
     * Get the policy that was acted upon.
     */
    public function policy()
    {
        return $this->belongsTo(Policy::class)->withTrashed();
    }

    /**
     * Get the policy title, even if the policy is deleted
     */
    public function getPolicyTitleAttribute()
    {
        if ($this->policy) {
            return $this->policy->title;
        }
        return $this->details['title'] ?? 'Deleted Policy';
    }
} 