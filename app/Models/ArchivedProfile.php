<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ArchivedProfile extends Model
{
    protected $fillable = [
        'profile_id',
        'archive_reason',
        'archived_date'
    ];

    protected $dates = [
        'archived_date',
        'created_at',
        'updated_at'
    ];

    protected $casts = [
        'archived_date' => 'datetime',
    ];

    public function profile()
    {
        return $this->belongsTo(Profile::class);
    }
}