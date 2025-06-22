<?php
// Template.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Template extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'category',
        'file_type',
        'file_path',
        'file_size',
        'download_count',
        'status',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'download_count' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    public function incrementDownloadCount()
    {
        $this->increment('download_count');
    }
    
    public function creator()
    {
        return $this->belongsTo(SkAccount::class, 'created_by');
    }
    
    public function updater()
    {
        return $this->belongsTo(SkAccount::class, 'updated_by');
    }
}