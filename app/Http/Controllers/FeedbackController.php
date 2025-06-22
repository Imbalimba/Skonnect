<?php

namespace App\Http\Controllers;

use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\ChatBotResponse;
use App\Models\CannedResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class FeedbackController extends Controller
{
    /**
     * Get all conversations for the authenticated youth user
     */
    public function getUserConversations(Request $request)
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['error' => 'User not authenticated'], 401);
        }
        
        $conversations = ChatConversation::with(['latestMessage'])
            ->where('account_id', $user->id)
            ->orderBy('last_activity_at', 'desc')
            ->get()
            ->map(function ($conversation) {
                $unreadCount = $conversation->messages()
                    ->where('sender_type', '!=', 'user')
                    ->where('is_read', false)
                    ->count();
                
                return [
                    'id' => $conversation->id,
                    'subject' => $conversation->subject,
                    'status' => $conversation->status,
                    'category' => $conversation->category,
                    'last_activity' => $conversation->last_activity_at,
                    'latest_message' => $conversation->latestMessage ? $conversation->latestMessage->message : null,
                    'unread_count' => $unreadCount,
                    'is_anonymous' => $conversation->is_anonymous
                ];
            });
        
        return response()->json($conversations);
    }
    
    /**
     * Create a new conversation
     */
    public function createConversation(Request $request)
    {
        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'message' => 'required|string',
            'category' => 'required|in:inquiry,complaint,suggestion,technical,other',
            'is_anonymous' => 'boolean'
        ]);
        
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['error' => 'User not authenticated'], 401);
        }
        
        try {
            DB::beginTransaction();
            
            // Create the conversation
            $conversation = ChatConversation::create([
                'account_id' => $user->id,
                'subject' => $validated['subject'],
                'category' => $validated['category'],
                'is_anonymous' => $validated['is_anonymous'] ?? false,
                'status' => 'active',
                'last_activity_at' => now()
            ]);
            
            // Add the user's first message
            $message = ChatMessage::create([
                'conversation_id' => $conversation->id,
                'message' => $validated['message'],
                'sender_type' => 'user',
                'sender_id' => $user->id,
                'is_read' => false
            ]);
            
            // Generate a bot response
            $botResponse = $this->generateBotResponse($validated['message'], $conversation);
            
            DB::commit();
            
            return response()->json([
                'conversation_id' => $conversation->id,
                'message' => 'Conversation created successfully',
                'bot_response' => $botResponse ? $botResponse->message : null
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to create conversation: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Get messages for a conversation
     */
    public function getConversationMessages(Request $request, $conversationId)
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['error' => 'User not authenticated'], 401);
        }
        
        $conversation = ChatConversation::where('id', $conversationId)
            ->where('account_id', $user->id)
            ->first();
        
        if (!$conversation) {
            return response()->json(['error' => 'Conversation not found'], 404);
        }
        
        $messages = ChatMessage::where('conversation_id', $conversationId)
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($message) {
                return [
                    'id' => $message->id,
                    'message' => $message->message,
                    'sender_type' => $message->sender_type,
                    'created_at' => $message->created_at,
                    'attachments' => $message->attachments
                ];
            });
        
        // Mark all agent and bot messages as read
        ChatMessage::where('conversation_id', $conversationId)
            ->whereIn('sender_type', ['agent', 'bot'])
            ->where('is_read', false)
            ->update(['is_read' => true]);
        
        return response()->json([
            'conversation' => [
                'id' => $conversation->id,
                'subject' => $conversation->subject,
                'category' => $conversation->category,
                'status' => $conversation->status,
                'is_anonymous' => $conversation->is_anonymous
            ],
            'messages' => $messages
        ]);
    }
    
    /**
     * Send a message in a conversation
     */
    public function sendMessage(Request $request, $conversationId)
    {
        $validated = $request->validate([
            'message' => 'required|string',
        ]);
        
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['error' => 'User not authenticated'], 401);
        }
        
        $conversation = ChatConversation::where('id', $conversationId)
            ->where('account_id', $user->id)
            ->first();
        
        if (!$conversation) {
            return response()->json(['error' => 'Conversation not found'], 404);
        }
        
        if ($conversation->status === 'closed') {
            return response()->json(['error' => 'Cannot send message to a closed conversation'], 400);
        }
        
        try {
            DB::beginTransaction();
            
            // Create the message
            $message = ChatMessage::create([
                'conversation_id' => $conversation->id,
                'message' => $validated['message'],
                'sender_type' => 'user',
                'sender_id' => $user->id,
                'is_read' => false
            ]);
            
            // Update conversation status if it was resolved
            if ($conversation->status === 'resolved') {
                $conversation->update(['status' => 'active']);
            }
            
            // Generate a bot response if no agent is assigned
            $botResponse = null;
            if (!$conversation->assigned_sk_id) {
                $botResponse = $this->generateBotResponse($validated['message'], $conversation);
            }
            
            DB::commit();
            
            return response()->json([
                'message' => 'Message sent successfully',
                'message_id' => $message->id,
                'bot_response' => $botResponse ? $botResponse->message : null
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to send message: ' . $e->getMessage()], 500);
        }
    }
    
    /**
     * Generate a bot response based on user message
     */
    private function generateBotResponse($userMessage, $conversation)
    {
        // Find matching bot responses
        $matches = ChatBotResponse::findMatches($userMessage);
        
        if ($matches->isNotEmpty()) {
            // Use the highest priority match
            $response = $matches->first();
            
            // Create and return bot message
            return ChatMessage::create([
                'conversation_id' => $conversation->id,
                'message' => $response->response,
                'sender_type' => 'bot',
                'sender_id' => null,
                'is_read' => false
            ]);
        }
        
        // Default response if no match found
        return ChatMessage::create([
            'conversation_id' => $conversation->id,
            'message' => "Thanks for your message. An SK officer will respond to you soon.",
            'sender_type' => 'bot',
            'sender_id' => null,
            'is_read' => false
        ]);
    }
    
    /**
     * Close a conversation (youth user)
     */
    public function closeConversation(Request $request, $conversationId)
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['error' => 'User not authenticated'], 401);
        }
        
        $conversation = ChatConversation::where('id', $conversationId)
            ->where('account_id', $user->id)
            ->first();
        
        if (!$conversation) {
            return response()->json(['error' => 'Conversation not found'], 404);
        }
        
        $conversation->update(['status' => 'closed']);
        
        // Add system message about closing
        ChatMessage::create([
            'conversation_id' => $conversation->id,
            'message' => 'This conversation has been closed by the user.',
            'sender_type' => 'bot',
            'sender_id' => null,
            'is_read' => true
        ]);
        
        return response()->json(['message' => 'Conversation closed successfully']);
    }
    
    /**
     * Reopen a closed conversation (youth user)
     */
    public function reopenConversation(Request $request, $conversationId)
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['error' => 'User not authenticated'], 401);
        }
        
        $conversation = ChatConversation::where('id', $conversationId)
            ->where('account_id', $user->id)
            ->where('status', 'closed')
            ->first();
        
        if (!$conversation) {
            return response()->json(['error' => 'Closed conversation not found'], 404);
        }
        
        $conversation->update(['status' => 'active']);
        
        // Add system message about reopening
        ChatMessage::create([
            'conversation_id' => $conversation->id,
            'message' => 'This conversation has been reopened by the user.',
            'sender_type' => 'bot',
            'sender_id' => null,
            'is_read' => true
        ]);
        
        return response()->json(['message' => 'Conversation reopened successfully']);
    }
}