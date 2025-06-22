<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Directory extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name',
        'role',
        'email',
        'phone',
        'location',
        'category',
        'created_by',
        'updated_by',
        'sk_station',
        'status',
        'position_order',
        'reports_to',
    ];

    /**
     * The creator of this directory entry.
     */
    public function creator()
    {
        return $this->belongsTo(Skaccount::class, 'created_by');
    }

    /**
     * The user who last updated this directory entry.
     */
    public function updater()
    {
        return $this->belongsTo(Skaccount::class, 'updated_by');
    }

    /**
     * The supervisor of this directory entry.
     */
    public function supervisor()
    {
        return $this->belongsTo(Directory::class, 'reports_to');
    }

    /**
     * The subordinates of this directory entry.
     */
    public function subordinates()
    {
        return $this->hasMany(Directory::class, 'reports_to');
    }

    /**
     * Calculate bookmark status based on creation/update time.
     * 
     * @return string|null
     */
    public function getBookmarkStatusAttribute()
    {
        $createdDate = $this->created_at;
        $updatedDate = $this->updated_at;
        $now = now();
        
        // New: created within the last 7 days
        $daysSinceCreation = $now->diffInDays($createdDate);
        
        // Updated: if update time is different from creation time
        $wasUpdated = $updatedDate->gt($createdDate);
        
        // Determine bookmark status
        if ($daysSinceCreation < 7 && !$wasUpdated) {
            return 'new';
        } elseif ($wasUpdated && $now->diffInDays($updatedDate) < 14) {
            return 'updated';
        } elseif ($this->category === 'executive' || $this->position_order <= 5) {
            return 'important';
        }
        
        return null;
    }
}