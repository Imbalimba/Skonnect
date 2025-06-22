<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\EventAttendee;
use App\Models\RegisteredAttendee;

class PublishEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'selected_tags',
        'description',
        'need_volunteers',
        'status',
        'event_type',
        'barangay'
    ];

    protected $casts = [
        'selected_tags' => 'array',
        'status' => 'string',
        'event_type' => 'string',
    ];

    public function event()
    {
        return $this->belongsTo(EventManage::class);
    }

    /**
     * Get the barangay for this event
     * If barangay is not set, get it from the event's barangay
     */
    public function getBarangayAttribute($value)
    {
        if (!$value && $this->event) {
            return $this->event->barangay;
        }
        return $value;
    }

    public function attendees(): HasMany
    {
        return $this->hasMany(EventAttendee::class, 'publish_event_id');
    }

    public function registeredAttendees(): HasMany
    {
        return $this->hasMany(RegisteredAttendee::class, 'publish_event_id');
    }

    public function getParticipantsCountAttribute()
    {
        return $this->registeredAttendees()->where('attendee_type', 'participant')->count();
    }

    public function getVolunteersCountAttribute()
    {
        return $this->registeredAttendees()->where('attendee_type', 'volunteer')->count();
    }
}
