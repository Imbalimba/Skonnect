<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RegisteredAttendee extends Model
{
    use HasFactory;

    protected $table = 'registered_attendees';

    protected $fillable = [
        'publish_event_id',
        'first_name',
        'middle_name',
        'last_name',
        'barangay',
        'attendee_type',
        'account_id',
        'attended',
        'eventmanage_id',
        'event_name'
    ];

    protected $casts = [
        'attended' => 'string' // Cast to string since it's an enum
    ];

    public $timestamps = true;

    public function publishEvent(): BelongsTo
    {
        return $this->belongsTo(PublishEvent::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function eventManage(): BelongsTo
    {
        return $this->belongsTo(EventManage::class, 'eventmanage_id');
    }

    // Accessor to get the event name from EventManage if event_name is not set
    public function getEventNameAttribute($value)
    {
        if (!$value && $this->eventManage) {
            return $this->eventManage->event;
        }
        return $value;
    }
}
