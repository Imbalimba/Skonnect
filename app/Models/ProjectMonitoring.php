<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectMonitoring extends Model
{
    use HasFactory;

    protected $table = 'project_monitoring';

    protected $fillable = [
        'ppas',
        'description',
        'expected_output',
        'performance_target',
        'period_implementation_start',
        'period_implementation_end',
        'total_budget',
        'person_responsible',
        'center_of_participation',
        'barangay'
    ];

    protected $casts = [
        'total_budget' => 'decimal:2',
    ];
}


