import React, { useState, useEffect } from 'react';
import '../css/SkFeedback.css';
import SkLayout from '../Components/SkLayout';
import SkFeedbackTabOne from '../Components/SkFeedbackTabOne';
import SkFeedbackChat from '../Components/SkFeedbackChat';

const SkFeedback = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState('chat');
  
  // Toggle active tab
  const toggleTab = (tab) => {
    setActiveTab(tab);
  };
  
  return (
    <SkLayout requireAuth={true}>
      <div className="sk-feedback-container">
        <div className="sk-feedback-header">
          <h1 className="sk-feedback-title">Youth Feedback</h1>
          <p className="sk-feedback-subtitle">
            Manage and respond to youth feedback, questions, suggestions, and complaints
          </p>
        </div>
        
        <div className="sk-feedback-tabs">
          <button 
            className={`sk-feedback-tab ${activeTab === 'submissions' ? 'active' : ''}`}
            onClick={() => toggleTab('submissions')}
          >
            Submissions
          </button>
          <button 
            className={`sk-feedback-tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => toggleTab('chat')}
          >
            Live Chat
          </button>
        </div>
        
        <div className="sk-feedback-content">
          {activeTab === 'submissions' ? (
            <SkFeedbackTabOne />
          ) : (
            <SkFeedbackChat />
          )}
        </div>
      </div>
    </SkLayout>
  );
};

export default SkFeedback;