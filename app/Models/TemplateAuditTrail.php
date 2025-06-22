<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TemplateAuditTrail extends Model
{
    use HasFactory;

    protected $fillable = [
        'template_id',
        'template_title',
        'action',
        'user_id',
        'user_name',
        'details'
    ];

    protected $casts = [
        'details' => 'array',
        'created_at' => 'datetime',
    ];

    // Relationship to Template
    public function template()
    {
        return $this->belongsTo(Template::class);
    }

    // Relationship to SkAccount
    public function user()
    {
        return $this->belongsTo(Skaccount::class, 'user_id');
    }
}