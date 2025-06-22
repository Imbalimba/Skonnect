<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BarangayPolicy extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'category',
        'file_path',
        'year',
        'barangay',
        'archived',
        'archive_reason',
        'archived_at',
        'skaccount_id'
    ];

    protected $casts = [
        'archived' => 'boolean',
        'archived_at' => 'datetime',
    ];

    /**
     * Get the SK account that created this policy
     */
    public function skaccount()
    {
        return $this->belongsTo(Skaccount::class, 'skaccount_id');
    }

    /**
     * Scope a query to only include archived policies
     */
    public function scopeArchived($query)
    {
        return $query->where('archived', true);
    }

    /**
     * Scope a query to only include policies for a specific barangay
     */
    public function scopeForBarangay($query, $barangay)
    {
        return $query->where('barangay', $barangay);
    }
}