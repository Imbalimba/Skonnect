<?php

namespace App\Http\Controllers;

use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\CannedResponse;
use App\Models\Skaccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SkFeedbackController extends Controller
{
    /**
     * Get all active conversations for the SK dashboard
     */
    public function getActiveConversations(Request $request)
    {
        $user = session('sk_user');
        
        if (!$user) {
            return response()->json(['error' => 'Not authenticated'], 401);
        }
        
        $query = ChatConversation::with(['latestMessage', 'account'])
            ->where('status', '!=', 'closed')
            ->orderBy('last_activity_at', 'desc');
        
        // If user is not admin/chairman, only show assigned conversations
        if ($user->sk_role !== 'Federasyon' && $user->sk_role !== 'Chairman') {
            $query->where('assigned_sk_id', $user->id);
        }
        
        $conversations = $query->get()->map(function ($conversation) {
            // Get user info but respect anonymity
            $userInfo = $conversation->is_anonymous ? 
                ['name' => 'Anonymous User'] : 
                [
                    'name' => $conversation->account ? 
                        $conversation->account->first_name . ' ' . $conversation->account->last_name : 'Unknown',
                    'barangay' => $conversation->account ? $conversation->account->baranggay : null
                ];
            
            $unreadCount = $conversation->messages()
                ->where('sender_type', 'user')
                ->where('is_read', false)
                ->count();
            
            return [
                'id' => $conversation->id,
                'subject' => $conversation->subject,
                'status' => $conversation->status,
                'category' => $conversation->category,
                'last_activity' => $conversation->last_activity_at,
                'latest_message' => $conversation->latestMessage ? $conversation->latestMessage->message : null,
                'latest_message_sender' => $conversation->latestMessage ? $conversation->latestMessage->sender_type : null,
                'user_info' => $userInfo,
                'assigned_to' => $conversation->assignedSk ? [
                    'id' => $conversation->assignedSk->id,
                    'name' => $conversation->assignedSk->first_name . ' ' . $conversation->assignedSk->last_name
                ] : null,
                'unread_count' => $unreadCount,
                'created_at' => $conversation->created_at
            ];
        });
        
        return response()->json($conversations);
    }
    
    /**
     * Get all closed conversations
     */
    public function getClosedConversations(Request $request)
    {
        $user = session('sk_user');
        
        if (!$user) {
            return response()->json(['error' => 'Not authenticated'], 401);
        }
        
        $query = ChatConversation::with(['latestMessage', 'account'])
            ->where('status', 'closed')
            ->orderBy('last_activity_at', 'desc');
        
        // If user is not admin/chairman, only show assigned conversations
        if ($user->sk_role !== 'Federasyon' && $user->sk_role !== 'Chairman') {
            $query->where('assigned_sk_id', $user->id);
        }
        
        $conversations = $query->get()->map(function ($conversation) {
            // Get user info but respect anonymity
            $userInfo = $conversation->is_anonymous ? 
                ['name' => 'Anonymous User'] : 
                [
                    'name' => $conversation->account ? 
                        $conversation->account->first_name . ' ' . $conversation->account->last_name : 'Unknown',
                    'barangay' => $conversation->account ? $conversation->account->baranggay : null
                ];
            
            return [
                'id' => $conversation->id,
                'subject' => $conversation->subject,
                'status' => $conversation->status,
                'category' => $conversation->category,
                'last_activity' => $conversation->last_activity_at,
                'user_info' => $userInfo,
                'assigned_to' => $conversation->assignedSk ? [
                    'id' => $conversation->assignedSk->id,
                    'name' => $conversation->assignedSk->first_name . ' ' . $conversation->assignedSk->last_name
                ] : null,
                'created_at' => $conversation->created_at,
                'closed_at' => $conversation->updated_at
            ];
        });
        
        return response()->json($conversations);
    }
    
    /**
     * Get conversation details with messages
     */
    public function getConversationDetails(Request $request, $conversationId)
    {
        $user = session('sk_user');
        
        if (!$user) {
            return response()->json(['error' => 'Not authenticated'], 401);
        }
        
        $query = ChatConversation::with(['account'])->where('id', $conversationId);
        
        // If user is not admin/chairman, only show assigned conversations
        if ($user->sk_role !== 'Federasyon' && $user->sk_role !== 'Chairman') {
            $query->where(function ($q) use ($user) {
                $q->where('assigned_sk_id', $user->id)
                  ->orWhereNull('assigned_sk_id');
            });
        }
        
        $conversation = $query->first();
        
        if (!$conversation) {
            return response()->json(['error' => 'Conversation not found'], 404);
        }
        
        // Get messages
        $messages = ChatMessage::where('conversation_id', $conversationId)
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($message) use ($conversation) {
                $senderInfo = null;
                
                if ($message->sender_type === 'user') {
                    if ($conversation->is_anonymous) {
                        $senderInfo = ['name' => 'Anonymous User'];
                    } else {
                        $senderInfo = [
                            'name' => $conversation->account ? 
                                $conversation->account->first_name . ' ' . $conversation->account->last_name : 'Unknown',
                        ];
                    }
                } elseif ($message->sender_type === 'agent') {
                    $agent = Skaccount::find($message->sender_id);
                    $senderInfo = $agent ? [
                        'name' => $agent->first_name . ' ' . $agent->last_name,
                        'role' => $agent->sk_role
                    ] : ['name' => 'Unknown Agent'];
                }
                
                return [
                    'id' => $message->id,
                    'message' => $message->message,
                    'sender_type' => $message->sender_type,
                    'sender_info' => $senderInfo,
                    'is_read' => $message->is_read,
                    'created_at' => $message->created_at,
                    'attachments' => $message->attachments
                ];
            });
        
        // Get user info respecting anonymity
        $userInfo = $conversation->is_anonymous ? 
            ['name' => 'Anonymous User'] : 
            [
                'id' => $conversation->account ? $conversation->account->id : null,
                'name' => $conversation->account ? 
                    $conversation->account->first_name . ' ' . $conversation->account->last_name : 'Unknown',
                'email' => $conversation->account ? $conversation->account->email : null,
                'phone' => $conversation->account ? $conversation->account->phone_number : null,
                'barangay' => $conversation->account ? $conversation->account->baranggay : null
            ];
        
        // Mark all user messages as read
        ChatMessage::where('conversation_id', $conversationId)
            ->where('sender_type', 'user')
            ->where('is_read', false)
            ->update(['is_read' => true]);
        
        // If conversation is not assigned, assign it to the current agent
        if (!$conversation->assigned_sk_id) {
            $conversation->update([
                'assigned_sk_id' => $user->id
            ]);
            
            // Add system message about assignment
            ChatMessage::create([
                'conversation_id' => $conversation->id,
                'message' => "This conversation has been assigned to " . $user->first_name . " " . $user->last_name . ".",
                'sender_type' => 'bot',
                'sender_id' => null,
                'is_read' => true
            ]);
        }
        
        return response()->json([
            'conversation' => [
                'id' => $conversation->id,
                'subject' => $conversation->subject,
                'category' => $conversation->category,
                'status' => $conversation->status,
                'created_at' => $conversation->created_at,
                'user_info' => $userInfo,
                'assigned_to' => $conversation->assignedSk ? [
                    'id' => $conversation->assignedSk->id,
                    'name' => $conversation->assignedSk->first_name . ' ' . $conversation->assignedSk->last_name
                ] : null,
                'is_anonymous' => $conversation->is_anonymous
            ],
            'messages' => $messages
        ]);
    }
    
    /**
     * Send a message from an SK agent
     */
    public function sendAgentMessage(Request $request, $conversationId)
    {
        $validated = $request->validate([
            'message' => 'required|string',
        ]);
        
        $user = session('sk_user');
        
        if (!$user) {
            return response()->json(['error' => 'Not authenticated'], 401);
        }
        
        $query = ChatConversation::where('id', $conversationId);
        
        // If user is not admin/chairman, only interact with assigned conversations
        if ($user->sk_role !== 'Federasyon' && $user->sk_role !== 'Chairman') {
            $query->where(function ($q) use ($user) {
                $q->where('assigned_sk_id', $user->id)
                  ->orWhereNull('assigned_sk_id');
            });
        }
        
        $conversation = $query->first();
        
        if (!$conversation) {
            return response()->json(['error' => 'Conversation not found'], 404);
        }
        
        if ($conversation->status === 'closed') {
            return response()->json(['error' => 'Cannot send message to a closed conversation'], 400);
        }
        
        try {
            DB::beginTransaction();
            
            // If conversation is not assigned yet, assign it to the current agent
            if (!$conversation->assigned_sk_id) {
                $conversation->update([
                    'assigned_sk_id' => $user->id
                ]);
                
                // Add system message about assignment
                ChatMessage::create([
                    'conversation_id' => $conversation->id,
                    'message' => "This conversation has been assigned to " . $user->first_name . " " . $user->last_name . ".",
                    'sender_type' => 'bot',
                    'sender_id' => null,
                    'is_read' => true
                ]);
            }
            
            // Create the message
            $message = ChatMessage::create([
                'conversation_id' => $conversation->id,
                'message' => $validated['message'],
                'sender_type' => 'agent',
                'sender_id' => $user->id,
                'is_read' => false
            ]);
            
            // Update conversation status if needed
            if ($conversation->status === 'pending') {
                $conversation->update(['status' => 'active']);
            }
            
            DB::commit();
            
            return response()->json([
                'message' => 'Message sent successfully',
                'message_id' => $message->id
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to send message: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Change conversation status
     */
    public function changeConversationStatus(Request $request, $conversationId)
    {
        $validated = $request->validate([
            'status' => 'required|in:active,pending,resolved,closed',
        ]);
        
        $user = session('sk_user');
        
        if (!$user) {
            return response()->json(['error' => 'Not authenticated'], 401);
        }
        
        $query = ChatConversation::where('id', $conversationId);
        
        // If user is not admin/chairman, only modify assigned conversations
        if ($user->sk_role !== 'Federasyon' && $user->sk_role !== 'Chairman') {
            $query->where('assigned_sk_id', $user->id);
        }
        
        $conversation = $query->first();
        
        if (!$conversation) {
            return response()->json(['error' => 'Conversation not found'], 404);
        }
        
        $oldStatus = $conversation->status;
        $newStatus = $validated['status'];
        
        if ($oldStatus === $newStatus) {
            return response()->json(['message' => 'Status already set to ' . $newStatus]);
        }
        
        $conversation->update(['status' => $newStatus]);
        
        // Add system message about status change
        $statusMessages = [
            'active' => 'This conversation has been marked as active.',
            'pending' => 'This conversation has been marked as pending.',
            'resolved' => 'This conversation has been marked as resolved.',
            'closed' => 'This conversation has been closed by an SK officer.'
        ];
        
        ChatMessage::create([
            'conversation_id' => $conversation->id,
            'message' => $statusMessages[$newStatus],
            'sender_type' => 'bot',
            'sender_id' => null,
            'is_read' => true
        ]);
        
        return response()->json(['message' => 'Conversation status updated successfully']);
    }
    
    /**
     * Assign conversation to an SK agent
     */
    public function assignConversation(Request $request, $conversationId)
    {
        $validated = $request->validate([
            'sk_id' => 'required|exists:skaccounts,id',
        ]);
        
        $user = session('sk_user');
        
        if (!$user) {
            return response()->json(['error' => 'Not authenticated'], 401);
        }
        
        // Only Federasyon and Chairman can reassign conversations
        if ($user->sk_role !== 'Federasyon' && $user->sk_role !== 'Chairman') {
            return response()->json(['error' => 'Not authorized to assign conversations'], 403);
        }
        
        $conversation = ChatConversation::find($conversationId);
        
        if (!$conversation) {
            return response()->json(['error' => 'Conversation not found'], 404);
        }
        
        $skAgent = Skaccount::find($validated['sk_id']);
        
        if (!$skAgent) {
            return response()->json(['error' => 'SK agent not found'], 404);
        }
        
        $oldAgentId = $conversation->assigned_sk_id;
        
        if ($oldAgentId == $validated['sk_id']) {
            return response()->json(['message' => 'Conversation already assigned to this agent']);
        }
        
        $conversation->update(['assigned_sk_id' => $validated['sk_id']]);
        
        // Add system message about assignment
        ChatMessage::create([
            'conversation_id' => $conversation->id,
            'message' => "This conversation has been assigned to " . $skAgent->first_name . " " . $skAgent->last_name . ".",
            'sender_type' => 'bot',
            'sender_id' => null,
            'is_read' => true
        ]);
        
        return response()->json(['message' => 'Conversation assigned successfully']);
    }
    
    /**
     * Get all SK agents for assignment dropdown
     */
    public function getSkAgents(Request $request)
    {
        $user = session('sk_user');
        
        if (!$user) {
            return response()->json(['error' => 'Not authenticated'], 401);
        }
        
        // Only Federasyon and Chairman can see all agents
        if ($user->sk_role !== 'Federasyon' && $user->sk_role !== 'Chairman') {
            return response()->json(['error' => 'Not authorized to view all agents'], 403);
        }
        
        $agents = Skaccount::where('authentication_status', 'active')
            ->get()
            ->map(function ($agent) {
                return [
                    'id' => $agent->id,
                    'name' => $agent->first_name . ' ' . $agent->last_name,
                    'role' => $agent->sk_role,
                    'station' => $agent->sk_station
                ];
            });
        
        return response()->json($agents);
    }
    
    /**
     * Get canned responses
     */
    public function getCannedResponses(Request $request)
    {
        $user = session('sk_user');
        
        if (!$user) {
            return response()->json(['error' => 'Not authenticated'], 401);
        }
        
        $category = $request->query('category');
        
        $query = CannedResponse::where(function ($q) use ($user) {
            $q->where('is_public', true)
              ->orWhere('created_by', $user->id);
        });
        
        if ($category) {
            $query->where('category', $category);
        }
        
        $responses = $query->orderBy('title')->get();
        
        return response()->json($responses);
    }
    
    /**
     * Create a canned response
     */
    public function createCannedResponse(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category' => 'required|in:greeting,inquiry,complaint,suggestion,technical,closing,other',
            'is_public' => 'boolean'
        ]);
        
        $user = session('sk_user');
        
        if (!$user) {
            return response()->json(['error' => 'Not authenticated'], 401);
        }
        
        $response = CannedResponse::create([
            'title' => $validated['title'],
            'content' => $validated['content'],
            'category' => $validated['category'],
            'is_public' => $validated['is_public'] ?? false,
            'created_by' => $user->id
        ]);
        
        return response()->json([
            'message' => 'Canned response created successfully',
            'response' => $response
        ], 201);
    }
    
    /**
     * Update a canned response
     */
    public function updateCannedResponse(Request $request, $responseId)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category' => 'required|in:greeting,inquiry,complaint,suggestion,technical,closing,other',
            'is_public' => 'boolean'
        ]);
        
        $user = session('sk_user');
        
        if (!$user) {
            return response()->json(['error' => 'Not authenticated'], 401);
        }
        
        $response = CannedResponse::where('id', $responseId)
            ->where('created_by', $user->id)
            ->first();
        
        if (!$response) {
            return response()->json(['error' => 'Canned response not found or not owned by you'], 404);
        }
        
        $response->update([
            'title' => $validated['title'],
            'content' => $validated['content'],
            'category' => $validated['category'],
            'is_public' => $validated['is_public'] ?? $response->is_public
        ]);
        
        return response()->json([
            'message' => 'Canned response updated successfully',
            'response' => $response
        ]);
    }
    
    /**
     * Delete a canned response
     */
    public function deleteCannedResponse(Request $request, $responseId)
    {
        $user = session('sk_user');
        
        if (!$user) {
            return response()->json(['error' => 'Not authenticated'], 401);
        }
        
        $response = CannedResponse::where('id', $responseId)
            ->where('created_by', $user->id)
            ->first();
        
        if (!$response) {
            return response()->json(['error' => 'Canned response not found or not owned by you'], 404);
        }
        
        $response->delete();
        
        return response()->json(['message' => 'Canned response deleted successfully']);
    }
    
    /**
     * Get feedback analytics
     */
    public function getFeedbackAnalytics(Request $request)
    {
        $user = session('sk_user');
        
        if (!$user) {
            return response()->json(['error' => 'Not authenticated'], 401);
        }
        
        // Only Federasyon and Chairman can view analytics
        if ($user->sk_role !== 'Federasyon' && $user->sk_role !== 'Chairman') {
            return response()->json(['error' => 'Not authorized to view analytics'], 403);
        }
        
        $period = $request->query('period', 'month');
        $startDate = null;
        $endDate = Carbon::now();
        
        switch ($period) {
            case 'week':
                $startDate = Carbon::now()->subDays(7);
                break;
            case 'month':
                $startDate = Carbon::now()->subDays(30);
                break;
            case 'quarter':
                $startDate = Carbon::now()->subMonths(3);
                break;
            case 'year':
                $startDate = Carbon::now()->subYear();
                break;
            default:
                $startDate = Carbon::now()->subDays(30);
        }
        
        // Total conversations
        $totalConversations = ChatConversation::whereBetween('created_at', [$startDate, $endDate])->count();
        
        // Conversations by status
        $conversationsByStatus = ChatConversation::whereBetween('created_at', [$startDate, $endDate])
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();
        
        // Conversations by category
        $conversationsByCategory = ChatConversation::whereBetween('created_at', [$startDate, $endDate])
            ->select('category', DB::raw('count(*) as count'))
            ->groupBy('category')
            ->get()
            ->pluck('count', 'category')
            ->toArray();
        
        // Average response time (first agent response after user message)
        $averageResponseTime = DB::select("
            SELECT AVG(response_time_seconds) as avg_time
            FROM (
                SELECT 
                    u.conversation_id,
                    u.created_at as user_time,
                    MIN(a.created_at) as agent_time,
                    TIMESTAMPDIFF(SECOND, u.created_at, MIN(a.created_at)) as response_time_seconds
                FROM chat_messages u
                JOIN chat_messages a ON u.conversation_id = a.conversation_id AND a.created_at > u.created_at
                WHERE 
                    u.sender_type = 'user' 
                    AND a.sender_type = 'agent'
                    AND u.created_at BETWEEN ? AND ?
                GROUP BY u.id, u.conversation_id, u.created_at
                HAVING response_time_seconds > 0
            ) as response_times
        ", [$startDate, $endDate]);
        
        $avgResponseTimeSeconds = $averageResponseTime[0]->avg_time ?? 0;
        
        // Format response time as readable string
        $responseTimeFormatted = $this->formatTimeInterval($avgResponseTimeSeconds);
        
        // Conversations over time (daily)
        $conversationsOverTime = ChatConversation::whereBetween('created_at', [$startDate, $endDate])
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->date,
                    'count' => $item->count
                ];
            });
        
        return response()->json([
            'total_conversations' => $totalConversations,
            'conversations_by_status' => $conversationsByStatus,
            'conversations_by_category' => $conversationsByCategory,
            'average_response_time' => [
                'seconds' => $avgResponseTimeSeconds,
                'formatted' => $responseTimeFormatted
            ],
            'conversations_over_time' => $conversationsOverTime,
            'period' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => $endDate->format('Y-m-d'),
                'name' => $period
            ]
        ]);
    }
    
    /**
     * Format time interval in seconds to a readable string
     */
    private function formatTimeInterval($seconds)
    {
        if (!$seconds) {
            return 'N/A';
        }
        
        if ($seconds < 60) {
            return round($seconds) . ' seconds';
        }
        
        if ($seconds < 3600) {
            $minutes = floor($seconds / 60);
            $secs = round($seconds % 60);
            return $minutes . ' min' . ($minutes > 1 ? 's' : '') . ($secs ? ' ' . $secs . ' sec' . ($secs > 1 ? 's' : '') : '');
        }
        
        $hours = floor($seconds / 3600);
        $minutes = floor(($seconds % 3600) / 60);
        return $hours . ' hour' . ($hours > 1 ? 's' : '') . ($minutes ? ' ' . $minutes . ' min' . ($minutes > 1 ? 's' : '') : '');
    }
}