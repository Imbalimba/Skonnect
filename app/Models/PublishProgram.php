<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PublishProgram extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'barangay',
        'time_start',
        'time_end',
        'description'
    ];

    protected $casts = [
        'time_start' => 'datetime',
        'time_end' => 'datetime'
    ];

    public function project()
    {
        return $this->belongsTo(ProjectMonitoring::class, 'project_id');
    }

    public function applicants()
    {
        return $this->hasMany(ProgramApplicant::class, 'publish_program_id');
    }
}
