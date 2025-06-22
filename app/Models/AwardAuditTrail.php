<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AwardAuditTrail extends Model
{
    use HasFactory;

    protected $fillable = [
        'award_id',
        'award_title',
        'action',
        'user_id',
        'user_name',
        'details'
    ];

    protected $casts = [
        'details' => 'array',
    ];

    public function award()
    {
        return $this->belongsTo(Award::class);
    }

    public function user()
    {
        return $this->belongsTo(Skaccount::class, 'user_id');
    }
}