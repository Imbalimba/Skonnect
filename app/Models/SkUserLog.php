<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SkUserLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'sk_account_id',
        'action',
        'description',
        'ip_address',
        'user_agent',
        'page'
    ];

    public function skaccount()
    {
        return $this->belongsTo(Skaccount::class, 'sk_account_id');
    }
}