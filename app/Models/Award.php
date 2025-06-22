<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Award extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'title',
        'description',
        'category',
        'recipients',
        'date_awarded',
        'main_image',
        'media', // Renamed from 'gallery' to 'media'
        'year',
        'status',
        'sk_station',
        'created_by',
        'updated_by',
        'view_count',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'date_awarded' => 'date',
        'media' => 'array', // Renamed from 'gallery' to 'media'
        'year' => 'integer',
        'view_count' => 'integer',
    ];

    /**
     * Get the creator of the award.
     */
    public function creator()
    {
        return $this->belongsTo(Skaccount::class, 'created_by');
    }

    /**
     * Get the user who last updated the award.
     */
    public function updater()
    {
        return $this->belongsTo(Skaccount::class, 'updated_by');
    }

    /**
     * Increment the view count for this award.
     *
     * @return void
     */
    public function incrementViewCount()
    {
        $this->increment('view_count');
    }

    /**
     * Get bookmark status based on criteria (new or updated)
     * Removed 'popular' bookmark that was based on view count
     * 
     * @return string|null
     */
    public function getBookmarkStatus()
    {
        // Get dates for calculations
        $createdDate = $this->created_at;
        $updatedDate = $this->updated_at;
        $now = now();
        $daysSinceCreation = $now->diffInDays($createdDate);
        
        // Default bookmarkStatus is null (no bookmark)
        $bookmarkStatus = null;
        
        // First check if the award has been updated (updated_at is different from created_at)
        if ($updatedDate->gt($createdDate)) {
            $bookmarkStatus = 'updated';
        }
        // Then check for new awards
        elseif ($daysSinceCreation < 7) {
            $bookmarkStatus = 'new';
        }
        
        return $bookmarkStatus;
    }
}