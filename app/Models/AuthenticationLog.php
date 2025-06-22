<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuthenticationLog extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'user_id',
        'authenticator_id',
        'log_type',
        'action',
        'details',
    ];

    /**
     * Get the user that was authenticated/rejected.
     */
    public function user()
    {
        return $this->belongsTo(Skaccount::class, 'user_id');
    }

    /**
     * Get the admin who performed the authentication/rejection.
     */
    public function authenticator()
    {
        return $this->belongsTo(Skaccount::class, 'authenticator_id');
    }
}