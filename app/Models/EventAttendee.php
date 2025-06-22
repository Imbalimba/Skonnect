<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventAttendee extends Model
{
    use HasFactory;

    protected $fillable = [
        'publish_event_id',
        'profile_id',
        'attendees_email',
        'status'
    ];

    public function publishEvent(): BelongsTo
    {
        return $this->belongsTo(PublishEvent::class);
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }
}
