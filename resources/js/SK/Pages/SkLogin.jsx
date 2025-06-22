import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import '../css/SkStyles.css'; // Using the SK styles
import bgImage from '../images/background.png';
import skLogo from '../images/profile.png';
import { AuthContext } from '../../Contexts/AuthContext';
import { FaCheck, FaTimes, FaExclamationTriangle, FaCalendarAlt, FaUserClock } from 'react-icons/fa';

// Status Prompt Component
const StatusPrompt = ({ verified, authenticated, email, onClose }) => {
  const navigate = useNavigate();

  const handleVerificationClick = () => {
    if (!verified) {
      navigate('/sk-verify-email', { state: { email } });
    }
  };

  return (
    <div className="sk-cmn-sklcss-modal-overlay">
      <div className="sk-cmn-sklcss-modal-content sk-cmn-sklcss-status-prompt">
        <h3 className="sk-cmn-sklcss-status-title">Account Status</h3>
        <p className="sk-cmn-sklcss-status-subtitle">Your account requires verification and authentication before you can log in.</p>
        
        <div className="sk-cmn-sklcss-status-items">
          <div 
            className={`sk-cmn-sklcss-status-item ${verified ? 'sk-cmn-sklcss-status-success' : 'sk-cmn-sklcss-status-error'}`}
            onClick={handleVerificationClick}
            style={{ cursor: !verified ? 'pointer' : 'default' }}
          >
            <div className="sk-cmn-sklcss-status-icon">
              {verified ? <FaCheck /> : <FaTimes />}
            </div>
            <div className="sk-cmn-sklcss-status-text">
              <strong>Email Verification</strong>
              <span>{verified ? 'Verified' : 'Not Verified'}</span>
              {!verified && <small>Click to verify your email</small>}
            </div>
          </div>
          
          <div className={`sk-cmn-sklcss-status-item ${authenticated ? 'sk-cmn-sklcss-status-success' : 'sk-cmn-sklcss-status-error'}`}>
            <div className="sk-cmn-sklcss-status-icon">
              {authenticated ? <FaCheck /> : <FaTimes />}
            </div>
            <div className="sk-cmn-sklcss-status-text">
              <strong>Account Authentication</strong>
              <span>{authenticated ? 'Authenticated' : 'Not Authenticated'}</span>
              {!authenticated && <small>Please contact an administrator to authenticate your account</small>}
            </div>
          </div>
        </div>
        
        <div className="sk-cmn-sklcss-status-actions">
          <button className="sk-cmn-sklcss-button sk-cmn-sklcss-button-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Add EligibilityPrompt component
const EligibilityPrompt = ({ eligibilityIssues, onClose }) => {
  return (
    <div className="sk-cmn-sklcss-modal-overlay">
      <div className="sk-cmn-sklcss-modal-content sk-cmn-sklcss-status-prompt">
        <h3 className="sk-cmn-sklcss-status-title">Eligibility Issues</h3>
        <p className="sk-cmn-sklcss-status-subtitle">Your account has eligibility issues that prevent you from logging in.</p>
        
        <div className="sk-cmn-sklcss-status-items">
          {eligibilityIssues.map((issue, index) => (
            <div 
              key={index}
              className="sk-cmn-sklcss-status-item sk-cmn-sklcss-status-error"
            >
              <div className="sk-cmn-sklcss-status-icon">
                {issue.includes('term') ? <FaCalendarAlt /> : <FaUserClock />}
              </div>
              <div className="sk-cmn-sklcss-status-text">
                <strong>{issue.includes('term') ? 'Term Issue' : 'Age Restriction'}</strong>
                <span>{issue}</span>
              </div>
            </div>
          ))}
          
          <div className="alert alert-info mt-3">
            <FaExclamationTriangle className="me-2" />
            Contact your SK administrator for assistance with account renewal.
          </div>
        </div>
        
        <div className="sk-cmn-sklcss-status-actions">
          <button className="sk-cmn-sklcss-button sk-cmn-sklcss-button-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const SkLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showStatusPrompt, setShowStatusPrompt] = useState(false);
  const [statusInfo, setStatusInfo] = useState({
    verified: false,
    authenticated: false,
    email: ''
  });
  const [showEligibilityPrompt, setShowEligibilityPrompt] = useState(false);
  const [eligibilityIssues, setEligibilityIssues] = useState([]);
  
  const navigate = useNavigate();
  const { skUser, skLogin, pendingVerification, clearPendingVerification } = useContext(AuthContext);
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (skUser) {
      navigate('/sk-welcome');
    }
    
    // Instead of automatically redirecting, we'll check if we should show the status prompt
    // This handles the case where a user came back to the login page after a previous login attempt
    if (pendingVerification.waiting && pendingVerification.type === 'sk' && 
        pendingVerification.purpose === 'verification') {
      // Show status prompt with verification pending
      setShowStatusPrompt(true);
      setStatusInfo({
        verified: false,
        authenticated: false,
        email: pendingVerification.email
      });
      
      // Clear the pending verification since we're handling it with our status prompt
      clearPendingVerification();
    }
  }, [skUser, pendingVerification, navigate, clearPendingVerification]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      const { success, error: loginError, verified, authenticated, needs2FA, email, eligibility_issues } = await skLogin(
        formData.email,
        formData.password
      );
      
      if (success) {
        if (needs2FA) {
          // Redirect to 2FA verification page
          navigate('/sk-2fa-verify', { state: { email: email || formData.email } });
        } else {
          navigate('/sk-welcome');
        }
      } else if (eligibility_issues) {
        // Show eligibility issues prompt
        setEligibilityIssues(eligibility_issues);
        setShowEligibilityPrompt(true);
      } else if (verified === false || authenticated === false) {
        // Show the status prompt with the correct statuses
        setShowStatusPrompt(true);
        setStatusInfo({ 
          verified: verified === true, 
          authenticated: authenticated === true, 
          email: email || formData.email 
        });
        
        // If pending verification was set in AuthContext, clear it since we're showing the status prompt
        if (pendingVerification.waiting) {
          clearPendingVerification();
        }
      } else {
        setError(loginError || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again later.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // If already logged in, don't render the form (will redirect via useEffect)
  if (skUser) {
    return <div className="sk-cmn-sklcss-loading">Redirecting...</div>;
  }

  return (
    <div className="sk-cmn-sklcss-container">
      <div className="sk-cmn-sklcss-content">
        <img src={bgImage} alt="Background" className="sk-cmn-sklcss-background" />
        
        <div className="sk-cmn-sklcss-card">
          <div className="sk-cmn-sklcss-card-header">
            <img src={skLogo} alt="SK Logo" className="sk-cmn-sklcss-profile-icon" />
            <h2>Sangguniang Kabataan Login</h2>
          </div>
          
          <div className="sk-cmn-sklcss-card-body">
            <form className="sk-cmn-sklcss-form" onSubmit={handleLogin}>
              <div className="sk-cmn-sklcss-form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  className="sk-cmn-sklcss-input"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              
              <div className="sk-cmn-sklcss-form-group">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  className="sk-cmn-sklcss-input"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              
              <div className="sk-cmn-sklcss-options-row">
                <div></div> {/* Empty div to maintain layout */}
                <a href="/sk-forgot-password" className="sk-cmn-sklcss-link">Forgot password?</a>
              </div>
              
              {error && <p className="sk-cmn-sklcss-error">{error}</p>}
              
              <button 
                type="submit" 
                className="sk-cmn-sklcss-button sk-cmn-sklcss-button-primary sk-cmn-sklcss-button-full"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>
            
            <p className="sk-cmn-sklcss-text-center sk-cmn-sklcss-mt-3">
              No account yet? 
              <NavLink to="/sk-signup" className="sk-cmn-sklcss-link"> Register here</NavLink>
            </p>
          </div>
        </div>
      </div>
      
      {/* Status Prompt Modal */}
      {showStatusPrompt && (
        <StatusPrompt
          verified={statusInfo.verified}
          authenticated={statusInfo.authenticated}
          email={statusInfo.email}
          onClose={() => setShowStatusPrompt(false)}
        />
      )}
      
      {/* Eligibility Issues Modal */}
      {showEligibilityPrompt && (
        <EligibilityPrompt
          eligibilityIssues={eligibilityIssues}
          onClose={() => setShowEligibilityPrompt(false)}
        />
      )}
    </div>
  );
};

export default SkLogin;