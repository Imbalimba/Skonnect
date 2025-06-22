<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AnnouncementActivityLog extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'sk_account_id',
        'announcement_id',
        'activity_type',
        'action',
        'details',
    ];

    /**
     * Get the SK account that performed the action.
     */
    public function skAccount()
    {
        return $this->belongsTo(Skaccount::class, 'sk_account_id');
    }

    /**
     * Get the announcement that was acted upon.
     */
    public function announcement()
    {
        return $this->belongsTo(Announcement::class, 'announcement_id');
    }
} 