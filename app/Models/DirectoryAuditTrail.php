<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DirectoryAuditTrail extends Model
{
    use HasFactory;

    protected $fillable = [
        'directory_id',
        'directory_name',
        'action',
        'user_id',
        'user_name',
        'details'
    ];

    protected $casts = [
        'details' => 'array',
        'created_at' => 'datetime',
    ];

    // Relationship to Directory
    public function directory()
    {
        return $this->belongsTo(Directory::class);
    }

    // Relationship to SkAccount
    public function user()
    {
        return $this->belongsTo(Skaccount::class, 'user_id');
    }
}