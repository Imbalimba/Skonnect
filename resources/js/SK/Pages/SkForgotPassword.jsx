import React, { useState, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import '../css/SkStyles.css';
import bgImage from '../images/background.png';
import skLogo from '../images/profile.png';
import { AuthContext } from '../../Contexts/AuthContext';

const SkForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPasswordSk, pendingVerification } = useContext(AuthContext);
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Validate email format
  const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const result = await forgotPasswordSk(email);
      
      if (result.success) {
        setSuccess(result.message || 'Password reset instructions have been sent to your email.');
        
        // If we have pending verification for reset, redirect to reset verification page
        if (pendingVerification.waiting && pendingVerification.purpose === 'reset') {
          setTimeout(() => {
            navigate('/sk-reset-verify', { 
              state: { 
                email: pendingVerification.email,
                type: pendingVerification.type
              } 
            });
          }, 2000);
        }
      } else {
        setError(result.message || 'Failed to process your request.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sk-cmn-sklcss-container">
      <div className="sk-cmn-sklcss-content">
        <img src={bgImage} alt="Background" className="sk-cmn-sklcss-background" />
        
        <div className="sk-cmn-sklcss-card">
          <div className="sk-cmn-sklcss-card-header">
            <img src={skLogo} alt="SK Logo" className="sk-cmn-sklcss-profile-icon" />
            <h2>Forgot Password</h2>
          </div>
          
          <div className="sk-cmn-sklcss-card-body">
            <p className="text-center">Enter your email address and we'll send you a verification code to reset your password.</p>
            
            {error && <div className="sk-cmn-sklcss-alert sk-cmn-sklcss-alert-danger">{error}</div>}
            {success && <div className="sk-cmn-sklcss-alert sk-cmn-sklcss-alert-success">{success}</div>}
            
            <form className="sk-cmn-sklcss-form" onSubmit={handleSubmit}>
              <div className="sk-cmn-sklcss-form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  className="sk-cmn-sklcss-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className="sk-cmn-sklcss-button sk-cmn-sklcss-button-primary sk-cmn-sklcss-button-full"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Send Reset Instructions'}
              </button>
            </form>
            
            <p className="sk-cmn-sklcss-text-center sk-cmn-sklcss-mt-3">
              Remember your password? 
              <NavLink to="/sk-login" className="sk-cmn-sklcss-link"> Back to Login</NavLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkForgotPassword;