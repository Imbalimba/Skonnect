<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventManage extends Model
{
    use HasFactory;

    protected $table = 'eventmanage';

    protected $fillable = [ 
        'event',
        'timeframe',
        'location',
        'description',
        'status',
        'barangay'
    ];

    protected $casts = [
        'timeframe' => 'datetime',
        'created_on' => 'datetime',
    ];

    public function publishEvents()
    {
        return $this->hasMany(PublishEvent::class);
    }
}
