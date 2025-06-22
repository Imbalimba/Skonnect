import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaSearch, FaFilter, FaSpinner, FaUserCircle, FaArrowLeft, 
         FaPaperPlane, FaRegSmile, FaEllipsisV, FaUserCog, 
         FaCheck, FaClock, FaArchive, FaCommentSlash, FaCaretDown } from 'react-icons/fa';
import CannedResponseSelector from './CannedResponseSelector';
import SkFeedbackChatAnalytics from './SkFeedbackChatAnalytics';

const SkFeedbackChat = () => {
  // State variables
  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [closedConversations, setClosedConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [filter, setFilter] = useState({
    status: 'all',
    category: 'all'
  });
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const [skAgents, setSkAgents] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [showClosedConversations, setShowClosedConversations] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [showCannedResponses, setShowCannedResponses] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  
  // Fetch conversations
  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      
      // Fetch active conversations
      const response = await axios.get('/api/sk/conversations/active');
      setConversations(response.data);
      setFilteredConversations(response.data);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setIsLoading(false);
    }
  };
  
  // Fetch closed conversations
  const fetchClosedConversations = async () => {
    try {
      const response = await axios.get('/api/sk/conversations/closed');
      setClosedConversations(response.data);
    } catch (error) {
      console.error('Error fetching closed conversations:', error);
    }
  };
  
  // Fetch SK agents for assignment
  const fetchSkAgents = async () => {
    try {
      const response = await axios.get('/api/sk/agents');
      setSkAgents(response.data);
    } catch (error) {
      console.error('Error fetching SK agents:', error);
    }
  };
  
  // Set up polling at different intervals based on conversation state
  useEffect(() => {
    // Immediately fetch conversations
    fetchConversations();
    fetchClosedConversations();
    fetchSkAgents();
    
    // Different polling intervals 
    const ACTIVE_POLL_INTERVAL = 3000;  // 3 seconds when viewing a conversation
    const BACKGROUND_POLL_INTERVAL = 10000; // 10 seconds when browsing the list
    
    // Determine polling interval based on whether there's an active conversation
    const pollInterval = activeConversation ? ACTIVE_POLL_INTERVAL : BACKGROUND_POLL_INTERVAL;
    
    // Set up polling
    const interval = setInterval(() => {
      // Only refresh the list if not in an active conversation
      if (!activeConversation) {
        fetchConversations();
        if (showClosedConversations) {
          fetchClosedConversations();
        }
      } else {
        // If there's an active conversation, refresh it
        loadConversation(activeConversation.id);
      }
    }, pollInterval);
    
    return () => clearInterval(interval);
  }, [activeConversation, showClosedConversations]);
  
  // Filter conversations when search or filter changes
  useEffect(() => {
    if (!conversations) return;
    
    let filtered = [...conversations];
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(conv => 
        (conv.subject && conv.subject.toLowerCase().includes(query)) ||
        (conv.latest_message && conv.latest_message.toLowerCase().includes(query)) ||
        (conv.user_info && conv.user_info.name && conv.user_info.name.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    if (filter.status !== 'all') {
      filtered = filtered.filter(conv => conv.status === filter.status);
    }
    
    // Apply category filter
    if (filter.category !== 'all') {
      filtered = filtered.filter(conv => conv.category === filter.category);
    }
    
    setFilteredConversations(filtered);
  }, [searchQuery, filter, conversations]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Load conversation messages
  const loadConversation = async (conversationId, forceRefresh = false) => {
    try {
      if (!forceRefresh) {
        setIsLoading(true);
      }
      
      // Get the last message timestamp if it exists
      const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
      const lastTimestamp = lastMessage && !forceRefresh ? lastMessage.created_at : null;
      
      const response = await axios.get(`/api/sk/conversations/${conversationId}`, {
        params: {
          since: lastTimestamp
        }
      });
      
      // If this is the first load or we're forcing a refresh
      if (forceRefresh || !lastTimestamp || !activeConversation || activeConversation.id !== conversationId) {
        setActiveConversation(response.data.conversation);
        setMessages(response.data.messages);
      } else {
        // Only update if there are new messages
        if (response.data.messages.length > messages.length) {
          setMessages(response.data.messages);
          
          // Update the active conversation object
          setActiveConversation(response.data.conversation);
        }
      }
      
      // Reset UI states
      setShowStatusMenu(false);
      setShowAssignMenu(false);
      setShowCannedResponses(false);
      
      if (!forceRefresh) {
        setIsLoading(false);
        
        // Focus on message input
        setTimeout(() => {
          messageInputRef.current?.focus();
        }, 100);
      }
      
    } catch (error) {
      console.error('Error loading conversation:', error);
      setIsLoading(false);
    }
  };
  
  // Send message
  const sendMessage = async () => {
    if (newMessage.trim() === '' || !activeConversation) return;
    
    try {
      setIsSendingMessage(true);
      
      // Add optimistic message
      const tempMessage = {
        id: 'temp-' + Date.now(),
        message: newMessage,
        sender_type: 'agent',
        sender_info: { name: 'Me' },
        created_at: new Date().toISOString(),
        is_sending: true
      };
      
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
      
      // Send to server
      const response = await axios.post(`/api/sk/conversations/${activeConversation.id}/messages`, {
        message: tempMessage.message
      });
      
      // Update messages with real message ID
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempMessage.id 
            ? { ...msg, id: response.data.message_id, is_sending: false } 
            : msg
        )
      );
      
      // Refresh conversation list
      fetchConversations();
      
      setIsSendingMessage(false);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Show error in the UI
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempMessage.id 
            ? { ...msg, is_sending: false, is_error: true } 
            : msg
        )
      );
      
      setIsSendingMessage(false);
    }
  };
  
  // Handle message input change
  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);
  };
  
  // Handle message submit on Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  // Change conversation status
  const changeConversationStatus = async (status) => {
    if (!activeConversation) return;
    
    try {
      setIsChangingStatus(true);
      
      await axios.put(`/api/sk/conversations/${activeConversation.id}/status`, {
        status: status
      });
      
      // Update the active conversation status
      setActiveConversation(prev => ({
        ...prev,
        status: status
      }));
      
      // Refresh conversation list
      fetchConversations();
      
      // Close status menu
      setShowStatusMenu(false);
      setIsChangingStatus(false);
      
      // Refresh messages
      loadConversation(activeConversation.id);
      
    } catch (error) {
      console.error('Error changing conversation status:', error);
      setIsChangingStatus(false);
    }
  };
  
  // Assign conversation to SK agent
  const assignConversation = async (agentId) => {
    if (!activeConversation) return;
    
    try {
      await axios.put(`/api/sk/conversations/${activeConversation.id}/assign`, {
        sk_id: agentId
      });
      
      // Refresh conversation
      loadConversation(activeConversation.id);
      
      // Close assign menu
      setShowAssignMenu(false);
      
    } catch (error) {
      console.error('Error assigning conversation:', error);
    }
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Format time for display
  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Today
    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    }
    
    // Yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Other dates
    return date.toLocaleDateString();
  };
  
  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilter(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Insert canned response into message
  const insertCannedResponse = (response) => {
    setNewMessage(response.content);
    setShowCannedResponses(false);
    
    // Focus on message input
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 100);
  };
  
  // Toggle between active and closed conversations
  const toggleConversationsList = () => {
    setShowClosedConversations(!showClosedConversations);
    
    // If switching to closed and they haven't been loaded yet
    if (!showClosedConversations && closedConversations.length === 0) {
      fetchClosedConversations();
    }
  };
  
  // Render the conversation list
  const renderConversationList = () => {
    const conversationsToShow = showClosedConversations ? closedConversations : filteredConversations;
    
    if (isLoading && conversationsToShow.length === 0) {
      return (
        <div className="sk-feedback-loading">
          <FaSpinner className="sk-feedback-spinner" />
          <p>Loading conversations...</p>
        </div>
      );
    }
    
    if (conversationsToShow.length === 0) {
      return (
        <div className="sk-feedback-empty">
          <p>No {showClosedConversations ? 'closed' : 'active'} conversations found.</p>
          {searchQuery || filter.status !== 'all' || filter.category !== 'all' ? (
            <button 
              className="sk-feedback-clear-filters"
              onClick={() => {
                setSearchQuery('');
                setFilter({ status: 'all', category: 'all' });
              }}
            >
              Clear Filters
            </button>
          ) : null}
        </div>
      );
    }
    
    return (
      <div className="sk-feedback-conversations-list">
        {conversationsToShow.map(conversation => (
          <div 
            key={conversation.id}
            className={`sk-feedback-conversation-item ${activeConversation?.id === conversation.id ? 'active' : ''}`}
            onClick={() => loadConversation(conversation.id)}
          >
            <div className="sk-feedback-conversation-header">
              <div className="sk-feedback-user-info">
                <FaUserCircle className="sk-feedback-user-icon" />
                <span className="sk-feedback-user-name">{conversation.user_info.name}</span>
              </div>
              <div className="sk-feedback-conversation-meta">
                <span className="sk-feedback-conversation-time">
                  {formatDate(conversation.last_activity || conversation.created_at)}
                </span>
                <span className={`sk-feedback-status ${conversation.status}`}>
                  {conversation.status}
                </span>
              </div>
            </div>
            <div className="sk-feedback-conversation-subject">
              {conversation.subject}
            </div>
            {conversation.latest_message && (
              <div className="sk-feedback-conversation-preview">
                <span className={`sk-feedback-sender-type ${conversation.latest_message_sender}`}>
                  {conversation.latest_message_sender === 'user' ? 'User: ' : 
                   conversation.latest_message_sender === 'agent' ? 'Agent: ' : 'Bot: '}
                </span>
                {conversation.latest_message.substring(0, 50)}
                {conversation.latest_message.length > 50 ? '...' : ''}
              </div>
            )}
            {conversation.unread_count > 0 && (
              <div className="sk-feedback-unread-badge">
                {conversation.unread_count}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  // Render the chat interface
  const renderChatInterface = () => {
    if (!activeConversation) {
      return (
        <div className="sk-feedback-chat-empty">
          <div className="sk-feedback-empty-icon">
            <FaCommentSlash />
          </div>
          <h3>No conversation selected</h3>
          <p>Select a conversation from the list to start chatting</p>
        </div>
      );
    }
    
    return (
      <div className="sk-feedback-chat-container">
        <div className="sk-feedback-chat-header">
          <button 
            className="sk-feedback-back-button"
            onClick={() => {
              setActiveConversation(null);
              fetchConversations();
            }}
          >
            <FaArrowLeft />
          </button>
          
          <div className="sk-feedback-chat-info">
            <div className="sk-feedback-chat-title">
              <span>{activeConversation.subject}</span>
              <div className={`sk-feedback-chat-status ${activeConversation.status}`}>
                {activeConversation.status}
              </div>
            </div>
            <div className="sk-feedback-chat-meta">
              <span className="sk-feedback-category">
                {activeConversation.category}
              </span>
              <span className="sk-feedback-created">
                Created: {formatDate(activeConversation.created_at)}
              </span>
            </div>
          </div>
          
          <div className="sk-feedback-user-details">
            <div className="sk-feedback-user-avatar">
              <FaUserCircle />
            </div>
            <div className="sk-feedback-user-info">
              <div className="sk-feedback-user-name">
                {activeConversation.user_info.name}
                {activeConversation.is_anonymous && <span className="sk-feedback-anonymous"> (Anonymous)</span>}
              </div>
              {!activeConversation.is_anonymous && activeConversation.user_info.barangay && (
                <div className="sk-feedback-user-barangay">
                  {activeConversation.user_info.barangay}
                </div>
              )}
            </div>
          </div>
          
          <div className="sk-feedback-chat-actions">
            <div className="sk-feedback-action-dropdown">
              <button 
                className="sk-feedback-action-button status-button"
                onClick={() => setShowStatusMenu(!showStatusMenu)}
              >
                <FaClock /> Status <FaCaretDown />
              </button>
              {showStatusMenu && (
                <div className="sk-feedback-status-menu">
                  <button 
                    className={`sk-feedback-status-option active ${activeConversation.status === 'active' ? 'selected' : ''}`}
                    onClick={() => changeConversationStatus('active')}
                    disabled={isChangingStatus || activeConversation.status === 'active'}
                  >
                    <FaCheck /> Active
                  </button>
                  <button 
                    className={`sk-feedback-status-option pending ${activeConversation.status === 'pending' ? 'selected' : ''}`}
                    onClick={() => changeConversationStatus('pending')}
                    disabled={isChangingStatus || activeConversation.status === 'pending'}
                  >
                    <FaClock /> Pending
                  </button>
                  <button 
                    className={`sk-feedback-status-option resolved ${activeConversation.status === 'resolved' ? 'selected' : ''}`}
                    onClick={() => changeConversationStatus('resolved')}
                    disabled={isChangingStatus || activeConversation.status === 'resolved'}
                  >
                    <FaCheck /> Resolved
                  </button>
                  <button 
                    className={`sk-feedback-status-option closed ${activeConversation.status === 'closed' ? 'selected' : ''}`}
                    onClick={() => changeConversationStatus('closed')}
                    disabled={isChangingStatus || activeConversation.status === 'closed'}
                  >
                    <FaArchive /> Closed
                  </button>
                </div>
              )}
            </div>
            
            <div className="sk-feedback-action-dropdown">
              <button 
                className="sk-feedback-action-button assign-button"
                onClick={() => setShowAssignMenu(!showAssignMenu)}
              >
                <FaUserCog /> Assign <FaCaretDown />
              </button>
              {showAssignMenu && (
                <div className="sk-feedback-assign-menu">
                  {skAgents.length === 0 ? (
                    <div className="sk-feedback-menu-empty">No agents available</div>
                  ) : (
                    skAgents.map(agent => (
                      <button 
                        key={agent.id}
                        className={`sk-feedback-agent-option ${activeConversation.assigned_to?.id === agent.id ? 'selected' : ''}`}
                        onClick={() => assignConversation(agent.id)}
                      >
                        {agent.name} - {agent.role}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="sk-feedback-chat-messages">
          {messages.map(message => (
            <div 
              key={message.id}
              className={`sk-feedback-message ${message.sender_type}`}
            >
              <div className="sk-feedback-message-header">
                <span className="sk-feedback-message-sender">
                  {message.sender_info?.name || (message.sender_type === 'bot' ? 'Bot' : 'Unknown')}
                </span>
                <span className="sk-feedback-message-time">
                  {formatTime(message.created_at)}
                </span>
              </div>
              <div className={`sk-feedback-message-content ${message.is_sending ? 'sending' : ''} ${message.is_error ? 'error' : ''}`}>
                {message.message}
                {message.is_sending && <div className="sk-feedback-sending">Sending...</div>}
                {message.is_error && <div className="sk-feedback-error">Failed to send. Try again.</div>}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="sk-feedback-chat-input-container">
          {showCannedResponses && (
            <CannedResponseSelector onSelect={insertCannedResponse} onClose={() => setShowCannedResponses(false)} />
          )}
          
          <div className="sk-feedback-chat-input-wrapper">
            <button 
              className="sk-feedback-canned-button"
              onClick={() => setShowCannedResponses(!showCannedResponses)}
              disabled={activeConversation?.status === 'closed'}
            >
              <FaRegSmile />
            </button>
            <textarea
              className="sk-feedback-chat-input"
              placeholder={activeConversation?.status === 'closed' ? 'This conversation is closed' : 'Type your message...'}
              value={newMessage}
              onChange={handleMessageChange}
              onKeyPress={handleKeyPress}
              disabled={activeConversation?.status === 'closed' || isSendingMessage}
              ref={messageInputRef}
            />
            <button 
              className="sk-feedback-send-button"
              onClick={sendMessage}
              disabled={newMessage.trim() === '' || activeConversation?.status === 'closed' || isSendingMessage}
            >
              {isSendingMessage ? <FaSpinner className="sk-feedback-spinner" /> : <FaPaperPlane />}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="sk-feedback-chat">
      {showAnalytics ? (
        <SkFeedbackChatAnalytics onClose={() => setShowAnalytics(false)} />
      ) : (
        <div className="sk-feedback-chat-layout">
          <div className="sk-feedback-sidebar">
            <div className="sk-feedback-sidebar-header">
              <div className="sk-feedback-search-container">
                <FaSearch className="sk-feedback-search-icon" />
                <input
                  type="text"
                  className="sk-feedback-search-input"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              <button 
                className="sk-feedback-analytics-button"
                onClick={() => setShowAnalytics(true)}
              >
                Analytics
              </button>
            </div>
            
            <div className="sk-feedback-filters">
              <div className="sk-feedback-filter-group">
                <label>Status:</label>
                <select 
                  value={filter.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              
              <div className="sk-feedback-filter-group">
                <label>Category:</label>
                <select 
                  value={filter.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="inquiry">Inquiry</option>
                  <option value="complaint">Complaint</option>
                  <option value="suggestion">Suggestion</option>
                  <option value="technical">Technical</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="sk-feedback-list-toggle">
              <button 
                className={`sk-feedback-toggle-button ${!showClosedConversations ? 'active' : ''}`}
                onClick={() => {
                  if (showClosedConversations) toggleConversationsList();
                }}
              >
                Active
              </button>
              <button 
                className={`sk-feedback-toggle-button ${showClosedConversations ? 'active' : ''}`}
                onClick={() => {
                  if (!showClosedConversations) toggleConversationsList();
                }}
              >
                Closed
              </button>
            </div>
            
            {renderConversationList()}
          </div>
          
          <div className="sk-feedback-main">
            {renderChatInterface()}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkFeedbackChat;