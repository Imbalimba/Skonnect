<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ProfileVolunteer extends Model
{
    use HasFactory;

    protected $table = 'profvolunteer';

    protected $fillable = [
        'account_id',
        'is_volunteer'

    ];

    protected $casts = [
        'is_volunteer' => 'string'
    ];

    /**
     * Get the account associated with the volunteer profile
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }
}
