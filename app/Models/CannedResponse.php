<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CannedResponse extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'content',
        'category',
        'created_by',
        'is_public',
    ];

    protected $casts = [
        'is_public' => 'boolean',
    ];

    /**
     * Get the SK account that created the canned response.
     */
    public function creator()
    {
        return $this->belongsTo(Skaccount::class, 'created_by');
    }

    /**
     * Scope a query to only include public responses.
     */
    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    /**
     * Scope a query to only include responses by category.
     */
    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Scope a query to only include responses created by a specific SK account.
     */
    public function scopeCreatedBy($query, $skAccountId)
    {
        return $query->where('created_by', $skAccountId);
    }
}