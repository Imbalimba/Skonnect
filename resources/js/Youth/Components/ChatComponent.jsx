import React, { useState, useEffect, useRef, useContext } from 'react';
import '../css/ChatComponent.css';
import { FaComments, FaTimes, FaPaperPlane, FaSpinner, FaRegSmile, FaThumbsUp, FaThumbsDown, FaInfoCircle } from 'react-icons/fa';
import axios from 'axios';
import { AuthContext } from '../../Contexts/AuthContext';

const ChatComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeConversation, setActiveConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [newConversation, setNewConversation] = useState({
    subject: '',
    category: 'inquiry',
    is_anonymous: false,
    message: ''
  });
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);
  const { user } = useContext(AuthContext);
  
  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      const response = await axios.get('/api/user/conversations');
      setConversations(response.data);
      
      // Count unread messages
      const unread = response.data.reduce((total, conv) => total + conv.unread_count, 0);
      setUnreadCount(unread);
      
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };
  
  // Enhanced version of fetchMessages to include last message timestamp
  const fetchMessages = async (conversationId) => {
    if (!user || !conversationId) return;
    
    try {
      setIsTyping(true);
      
      // Include the timestamp of the last message to only fetch new ones
      const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
      const lastTimestamp = lastMessage ? lastMessage.created_at : null;
      
      const response = await axios.get(`/api/user/conversations/${conversationId}/messages`, {
        params: {
          since: lastTimestamp
        }
      });
      
      // If this is the first fetch or we're refreshing the whole conversation
      if (!lastTimestamp) {
        setMessages(response.data.messages);
      } else {
        // Only append new messages
        if (response.data.messages.length > messages.length) {
          setMessages(response.data.messages);
        }
      }
      
      setActiveConversation(response.data.conversation);
      setIsTyping(false);
      
      // Refresh conversations to update unread count
      fetchConversations();
      
    } catch (error) {
      console.error('Error fetching messages:', error);
      setIsTyping(false);
    }
  };
    
  // Set up polling at different intervals based on conversation state
  useEffect(() => {
    if (!user) return;
    
    // Immediately fetch conversations on load
    fetchConversations();
    
    // Different polling intervals
    const ACTIVE_POLL_INTERVAL = 5000;  // 5 seconds when actively chatting
    const BACKGROUND_POLL_INTERVAL = 15000; // 15 seconds when not actively chatting
    
    // Determine polling interval based on whether there's an active conversation
    const pollInterval = activeConversation ? ACTIVE_POLL_INTERVAL : BACKGROUND_POLL_INTERVAL;
    
    // Set up polling
    const interval = setInterval(() => {
      // Refresh conversation list
      fetchConversations();
      
      // If there's an active conversation, refresh messages too
      if (activeConversation) {
        fetchMessages(activeConversation.id);
      }
    }, pollInterval);
    
    // If there are unread messages, poll more frequently
    if (unreadCount > 0) {
      // Clear the regular interval and poll more frequently
      clearInterval(interval);
      
      const urgentInterval = setInterval(() => {
        fetchConversations();
        
        if (activeConversation) {
          fetchMessages(activeConversation.id);
        }
      }, 3000); // Poll every 3 seconds when there are unread messages
      
      return () => clearInterval(urgentInterval);
    }
    
    return () => clearInterval(interval);
  }, [user, activeConversation, unreadCount]);
  
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && user) {
      // When opening the chat, focus on the active conversation or create new one view
      if (activeConversation) {
        fetchMessages(activeConversation.id);
      } else if (conversations.length > 0) {
        // Select most recent conversation by default
        const mostRecent = conversations[0];
        fetchMessages(mostRecent.id);
      } else {
        // Show new conversation form if no conversations exist
        setShowNewConversation(true);
      }
    }
  };
  
  const handleMessageInput = (e) => {
    setNewMessage(e.target.value);
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  const sendMessage = async () => {
    if (newMessage.trim() === '' || !activeConversation) return;
    
    try {
      // Optimistically add message to UI
      const optimisticMessage = {
        id: 'temp-' + Date.now(),
        message: newMessage,
        sender_type: 'user',
        created_at: new Date(),
        sending: true
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');
      setIsTyping(true);
      
      // Send message to server
      const response = await axios.post(`/api/user/conversations/${activeConversation.id}/messages`, {
        message: optimisticMessage.message
      });
      
      // Replace optimistic message with real one
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id ? 
          { ...msg, id: response.data.message_id, sending: false } : 
          msg
      ));
      
      // Add bot response if present
      if (response.data.bot_response) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: 'bot-' + Date.now(),
            message: response.data.bot_response,
            sender_type: 'bot',
            created_at: new Date()
          }]);
          setIsTyping(false);
        }, 1000); // Artificial delay for bot typing
      } else {
        setIsTyping(false);
      }
      
      // Focus input field for next message
      chatInputRef.current?.focus();
      
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      setHasError(true);
      setErrorMessage('Failed to send message. Please try again.');
      
      // Remove optimistic message
      setTimeout(() => {
        setHasError(false);
      }, 3000);
    }
  };
  
  const handleNewConversationChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewConversation(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const createNewConversation = async (e) => {
    e.preventDefault();
    
    if (!user) return;
    
    if (!newConversation.subject || !newConversation.message || !newConversation.category) {
      setHasError(true);
      setErrorMessage('Please fill out all required fields.');
      setTimeout(() => {
        setHasError(false);
      }, 3000);
      return;
    }
    
    try {
      setIsCreatingConversation(true);
      
      const response = await axios.post('/api/user/conversations', newConversation);
      
      // Reset form
      setNewConversation({
        subject: '',
        category: 'inquiry',
        is_anonymous: false,
        message: ''
      });
      
      // Refresh conversations and select the new one
      await fetchConversations();
      fetchMessages(response.data.conversation_id);
      
      // Hide new conversation form
      setShowNewConversation(false);
      setIsCreatingConversation(false);
      
    } catch (error) {
      console.error('Error creating conversation:', error);
      setIsCreatingConversation(false);
      setHasError(true);
      setErrorMessage('Failed to create conversation. Please try again.');
      setTimeout(() => {
        setHasError(false);
      }, 3000);
    }
  };
  
  const closeConversation = async () => {
    if (!activeConversation) return;
    
    try {
      await axios.put(`/api/user/conversations/${activeConversation.id}/close`);
      
      // Add system message about closing
      setMessages(prev => [...prev, {
        id: 'system-' + Date.now(),
        message: 'This conversation has been closed by you.',
        sender_type: 'bot',
        created_at: new Date()
      }]);
      
      // Refresh conversation
      fetchConversations();
      setActiveConversation(prev => ({
        ...prev,
        status: 'closed'
      }));
      
    } catch (error) {
      console.error('Error closing conversation:', error);
    }
  };
  
  const reopenConversation = async () => {
    if (!activeConversation) return;
    
    try {
      await axios.put(`/api/user/conversations/${activeConversation.id}/reopen`);
      
      // Add system message about reopening
      setMessages(prev => [...prev, {
        id: 'system-' + Date.now(),
        message: 'This conversation has been reopened by you.',
        sender_type: 'bot',
        created_at: new Date()
      }]);
      
      // Refresh conversation
      fetchConversations();
      setActiveConversation(prev => ({
        ...prev,
        status: 'active'
      }));
      
    } catch (error) {
      console.error('Error reopening conversation:', error);
    }
  };
  
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'pending': return 'Pending';
      case 'resolved': return 'Resolved';
      case 'closed': return 'Closed';
      default: return status;
    }
  };
  
  const renderConversationList = () => (
    <div className="youth-chatbox-conversations">
      <div className="youth-chatbox-conversations-header">
        <h3>Your Conversations</h3>
        <button 
          className="youth-chat-new-conversation-btn"
          onClick={() => setShowNewConversation(true)}
        >
          New Conversation
        </button>
      </div>
      
      <div className="youth-chatbox-conversations-list">
        {conversations.length === 0 ? (
          <div className="youth-chat-no-conversations">
            <p>You don't have any conversations yet.</p>
            <button 
              className="youth-chat-start-conversation-btn"
              onClick={() => setShowNewConversation(true)}
            >
              Start a Conversation
            </button>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div 
              key={conversation.id} 
              className={`youth-chatbox-conversation-item ${activeConversation?.id === conversation.id ? 'active' : ''}`}
              onClick={() => fetchMessages(conversation.id)}
            >
              <div className="youth-chatbox-conversation-title">
                {conversation.subject}
                {conversation.unread_count > 0 && (
                  <span className="youth-chatbox-unread-badge">{conversation.unread_count}</span>
                )}
              </div>
              <div className="youth-chatbox-conversation-preview">
                {conversation.latest_message ? (
                  conversation.latest_message.substring(0, 40) + 
                  (conversation.latest_message.length > 40 ? '...' : '')
                ) : 'No messages yet'}
              </div>
              <div className="youth-chatbox-conversation-meta">
                <span className={`youth-chatbox-conversation-status ${conversation.status}`}>
                  {getStatusText(conversation.status)}
                </span>
                <span className="youth-chatbox-conversation-time">
                  {formatDate(conversation.last_activity)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
  
  const renderMessages = () => (
    <div className="youth-chatbox-content">
      {messages.map((message) => (
        <div 
          key={message.id} 
          className={`youth-chat-message ${
            message.sender_type === 'user' ? 'youth-chat-message-user' : 
            message.sender_type === 'bot' ? 'youth-chat-message-bot' : 
            'youth-chat-message-agent'
          } ${message.sending ? 'sending' : ''}`}
        >
          <div className="youth-chat-message-content">
            {message.message}
            {message.sending && <span className="youth-chat-sending-indicator">Sending...</span>}
          </div>
          <div className="youth-chat-message-time">
            {message.created_at && formatTime(message.created_at)}
          </div>
        </div>
      ))}
      
      {isTyping && (
        <div className="youth-chat-message youth-chat-message-bot">
          <div className="youth-chat-message-content youth-chat-typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
  
  const renderConversationHeader = () => (
    <div className="youth-chatbox-conversation-header">
      <button 
        className="youth-chatbox-back-btn"
        onClick={() => {
          setActiveConversation(null);
          fetchConversations();
        }}
      >
        &larr; Back
      </button>
      <div className="youth-chatbox-conversation-info">
        <div className="youth-chatbox-subject">{activeConversation?.subject}</div>
        <div className="youth-chatbox-meta-info">
          <span className={`youth-chatbox-status ${activeConversation?.status}`}>
            {getStatusText(activeConversation?.status)}
          </span>
          {activeConversation?.is_anonymous && (
            <span className="youth-chatbox-anonymous-badge">Anonymous</span>
          )}
        </div>
      </div>
      <div className="youth-chatbox-conversation-actions">
        {activeConversation?.status === 'closed' ? (
          <button 
            className="youth-chatbox-action-btn reopen"
            onClick={reopenConversation}
          >
            Reopen
          </button>
        ) : (
          <button 
            className="youth-chatbox-action-btn close"
            onClick={closeConversation}
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
  
  const renderNewConversationForm = () => (
    <div className="youth-chatbox-new-conversation">
      <div className="youth-chatbox-new-conversation-header">
        <h3>New Conversation</h3>
        {conversations.length > 0 && (
          <button 
            className="youth-chatbox-back-btn"
            onClick={() => setShowNewConversation(false)}
          >
            &larr; Back
          </button>
        )}
      </div>
      
      <form onSubmit={createNewConversation} className="youth-chatbox-new-conversation-form">
        <div className="youth-chatbox-form-group">
          <label htmlFor="subject">Subject:</label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={newConversation.subject}
            onChange={handleNewConversationChange}
            placeholder="Enter subject..."
            maxLength={100}
            required
          />
        </div>
        
        <div className="youth-chatbox-form-group">
          <label htmlFor="category">Category:</label>
          <select
            id="category"
            name="category"
            value={newConversation.category}
            onChange={handleNewConversationChange}
            required
          >
            <option value="inquiry">Inquiry</option>
            <option value="complaint">Complaint</option>
            <option value="suggestion">Suggestion</option>
            <option value="technical">Technical Issue</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div className="youth-chatbox-form-group">
          <label htmlFor="message">Message:</label>
          <textarea
            id="message"
            name="message"
            value={newConversation.message}
            onChange={handleNewConversationChange}
            placeholder="Type your message here..."
            rows={4}
            required
          ></textarea>
        </div>
        
        <div className="youth-chatbox-form-group checkbox">
          <input
            type="checkbox"
            id="is_anonymous"
            name="is_anonymous"
            checked={newConversation.is_anonymous}
            onChange={handleNewConversationChange}
          />
          <label htmlFor="is_anonymous">Submit anonymously</label>
          <div className="youth-chatbox-anon-tooltip">
            <FaInfoCircle />
            <span className="youth-chatbox-tooltip-text">
              Your name and contact details will not be visible to SK officials if you choose anonymous submission.
            </span>
          </div>
        </div>
        
        <button 
          type="submit" 
          className="youth-chatbox-submit-btn"
          disabled={isCreatingConversation}
        >
          {isCreatingConversation ? (
            <>
              <FaSpinner className="youth-chat-spin" /> Creating...
            </>
          ) : (
            'Start Conversation'
          )}
        </button>
      </form>
    </div>
  );
  
  // Don't render the chat component for non-logged-in users
  if (!user) {
    return null;
  }
  
  return (
    <>
      <div 
        className={`youth-chat-icon ${isOpen ? 'youth-chat-icon-active' : ''} ${unreadCount > 0 ? 'has-unread' : ''}`} 
        onClick={toggleChat}
      >
        {isOpen ? <FaTimes /> : <FaComments />}
        {!isOpen && unreadCount > 0 && (
          <span className="youth-chat-notification-badge">{unreadCount}</span>
        )}
      </div>
      
      {isOpen && (
        <div className="youth-chatbox">
          <div className="youth-chatbox-header">
            <div className="youth-chatbox-title">
              <span className="youth-chatbox-title-text">SK Assist</span>
              <span className="youth-chatbox-status">Online</span>
            </div>
            <button className="youth-chatbox-close" onClick={toggleChat}>
              <FaTimes />
            </button>
          </div>
          
          {hasError && (
            <div className="youth-chat-error">
              {errorMessage}
            </div>
          )}
          
          {/* Show conversation list, active conversation, or new conversation form */}
          {showNewConversation ? (
            renderNewConversationForm()
          ) : activeConversation ? (
            <>
              {renderConversationHeader()}
              {renderMessages()}
              <form 
                className="youth-chatbox-input-container" 
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
              >
                <input
                  type="text"
                  className="youth-chatbox-input"
                  placeholder={activeConversation.status === 'closed' ? 
                    'This conversation is closed' : 
                    'Type your message here...'}
                  value={newMessage}
                  onChange={handleMessageInput}
                  onKeyPress={handleKeyPress}
                  disabled={activeConversation.status === 'closed' || isTyping}
                  ref={chatInputRef}
                />
                <button 
                  type="submit" 
                  className="youth-chatbox-send-btn"
                  disabled={newMessage.trim() === '' || activeConversation.status === 'closed' || isTyping}
                >
                  {isTyping ? <FaSpinner className="youth-chat-spin" /> : <FaPaperPlane />}
                </button>
              </form>
            </>
          ) : (
            renderConversationList()
          )}
          
        </div>
      )}
    </>
  );
};

export default ChatComponent;