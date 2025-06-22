<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'conversation_id',
        'message',
        'sender_type',
        'sender_id',
        'is_read',
        'attachments',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'attachments' => 'array',
    ];

    /**
     * Get the conversation that owns the message.
     */
    public function conversation()
    {
        return $this->belongsTo(ChatConversation::class, 'conversation_id');
    }

    /**
     * Get the sender of the message based on sender_type.
     */
    public function sender()
    {
        if ($this->sender_type === 'user') {
            return $this->belongsTo(Account::class, 'sender_id');
        } elseif ($this->sender_type === 'agent') {
            return $this->belongsTo(Skaccount::class, 'sender_id');
        }
        
        return null; // For bot messages
    }

    /**
     * Mark the message as read.
     */
    public function markAsRead()
    {
        $this->update(['is_read' => true]);
    }

    /**
     * Scope a query to only include unread messages.
     */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    /**
     * Scope a query to only include user messages.
     */
    public function scopeFromUser($query)
    {
        return $query->where('sender_type', 'user');
    }

    /**
     * Scope a query to only include agent messages.
     */
    public function scopeFromAgent($query)
    {
        return $query->where('sender_type', 'agent');
    }

    /**
     * Scope a query to only include bot messages.
     */
    public function scopeFromBot($query)
    {
        return $query->where('sender_type', 'bot');
    }

    /**
     * Update the conversation's last activity timestamp when a message is saved.
     */
    protected static function booted()
    {
        static::created(function ($message) {
            $message->conversation->update([
                'last_activity_at' => now(),
            ]);
        });
    }
}