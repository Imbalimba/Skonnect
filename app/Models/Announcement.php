<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Announcement extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'content',
        'visibility',
        'barangay', // Add this line
        'start_date',
        'end_date',
        'is_archived',
        'archive_reason',
        'archived_at',
        'skaccount_id'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'archived_at' => 'datetime',
        'is_archived' => 'boolean',
    ];

    /**
     * Get the SK account that created the announcement.
     */
    public function skaccount()
    {
        return $this->belongsTo(Skaccount::class);
    }

    /**
     * Scope to get only active announcements.
     */
    public function scopeActive($query)
    {
        return $query->where('is_archived', false)
                     ->where('start_date', '<=', now())
                     ->where(function($q) {
                         $q->whereNull('end_date')
                           ->orWhere('end_date', '>=', now());
                     });
    }

    /**
     * Scope to get only public announcements.
     */
    public function scopePublic($query)
    {
        return $query->where('visibility', 'public');
    }

    /**
     * Scope to get SK only announcements.
     */
    public function scopeSkOnly($query)
    {
        return $query->where('visibility', 'sk_only');
    }

    /**
     * Scope to get archived announcements.
     */
    public function scopeArchived($query)
    {
        return $query->where('is_archived', true);
    }

    /**
     * Scope to filter announcements by barangay.
     */
    public function scopeForBarangay($query, $barangay)
    {
        if ($barangay === 'all') {
            return $query;
        }

        return $query->where(function($q) use ($barangay) {
            $q->where('barangay', $barangay)
              ->orWhere('barangay', 'all');
        });
    }

    
}