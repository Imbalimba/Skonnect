<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ProgramAttendee extends Model
{
    use HasFactory;

    protected $fillable = [
        'publish_program_id',
        'account_id',
        'firstname',
        'middlename',
        'lastname',
        'barangay',
        'reason_for_applying'
    ];

    public function publishProgram()
    {
        return $this->belongsTo(PublishProgram::class, 'publish_program_id');
    }

    public function account()
    {
        return $this->belongsTo(Account::class);
    }
}
