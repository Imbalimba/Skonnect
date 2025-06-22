<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProgramApplicant extends Model
{
    use HasFactory;

    protected $fillable = [
        'publish_program_id',
        'firstname',
        'middlename',
        'lastname',
        'barangay'
    ];

    public function publishProgram()
    {
        return $this->belongsTo(PublishProgram::class, 'publish_program_id');
    }
}
