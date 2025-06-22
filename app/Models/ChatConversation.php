<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ChatConversation extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'account_id',
        'is_anonymous',
        'status',
        'category',
        'subject',
        'assigned_sk_id',
        'last_activity_at',
    ];

    protected $casts = [
        'is_anonymous' => 'boolean',
        'last_activity_at' => 'datetime',
    ];

    /**
     * Get the account that owns the conversation.
     */
    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    /**
     * Get the SK account assigned to the conversation.
     */
    public function assignedSk()
    {
        return $this->belongsTo(Skaccount::class, 'assigned_sk_id');
    }

    /**
     * Get the messages for the conversation.
     */
    public function messages()
    {
        return $this->hasMany(ChatMessage::class, 'conversation_id');
    }

    /**
     * Get the unread messages count for the conversation.
     */
    public function unreadMessagesCount()
    {
        return $this->messages()
            ->where('sender_type', '!=', 'agent')
            ->where('is_read', false)
            ->count();
    }

    /**
     * Scope a query to only include active conversations.
     */
    public function scopeActive($query)
    {
        return $query->whereIn('status', ['active', 'pending']);
    }

    /**
     * Scope a query to only include resolved conversations.
     */
    public function scopeResolved($query)
    {
        return $query->where('status', 'resolved');
    }

    /**
     * Scope a query to only include closed conversations.
     */
    public function scopeClosed($query)
    {
        return $query->where('status', 'closed');
    }

    /**
     * Get conversations requiring attention (unassigned or with unread messages).
     */
    public function scopeNeedsAttention($query)
    {
        return $query->where(function($q) {
            $q->whereNull('assigned_sk_id')
              ->orWhereExists(function($subquery) {
                  $subquery->selectRaw(1)
                           ->from('chat_messages')
                           ->whereColumn('chat_messages.conversation_id', 'chat_conversations.id')
                           ->where('chat_messages.sender_type', 'user')
                           ->where('chat_messages.is_read', false);
              });
        })->where('status', '!=', 'closed');
    }

    /**
     * Get the latest message for the conversation.
     */
    public function latestMessage()
    {
        return $this->hasOne(ChatMessage::class, 'conversation_id')->latest();
    }
}