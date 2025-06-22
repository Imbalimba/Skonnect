<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatBotResponse extends Model
{
    use HasFactory;

    protected $fillable = [
        'trigger_keyword',
        'response',
        'category',
        'priority',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'priority' => 'integer',
    ];

    /**
     * Scope a query to only include active responses.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to order by priority.
     */
    public function scopeByPriority($query)
    {
        return $query->orderBy('priority', 'desc');
    }

    /**
     * Find matching responses for a given message.
     */
    public static function findMatches($message)
    {
        $message = strtolower($message);
        
        return self::active()
            ->get()
            ->filter(function ($response) use ($message) {
                $keywords = explode(',', strtolower($response->trigger_keyword));
                
                foreach ($keywords as $keyword) {
                    $keyword = trim($keyword);
                    
                    // Check if the keyword is in the message
                    if (!empty($keyword) && strpos($message, $keyword) !== false) {
                        return true;
                    }
                }
                
                return false;
            })
            ->sortByDesc('priority');
    }
}