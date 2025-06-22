import React, { useState, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import background from '../../assets/home-banner.png';
import '../css/AuthStyles.css';
import { FaEnvelope, FaExclamationTriangle, FaCheck } from 'react-icons/fa';
import AuthLayout from '../Components/AuthLayout';
import { AuthContext } from '../../Contexts/AuthContext';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPasswordYouth, pendingVerification } = useContext(AuthContext);
  
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
      const result = await forgotPasswordYouth(email);
      
      if (result.success) {
        setSuccess(result.message || 'Password reset instructions have been sent to your email.');
        
        // If we have pending verification for reset, redirect to reset verification page
        if (pendingVerification.waiting && pendingVerification.purpose === 'reset') {
          setTimeout(() => {
            navigate('/reset-verify', { 
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
    <AuthLayout>
      <div className="youth-auth-container">
        <div className="youth-auth-background">
          <img src={background} alt="Background" className="youth-auth-bg-image" />
          <div className="youth-auth-bg-overlay"></div>
        </div>
        
        <div className="youth-auth-card">
          <div className="youth-auth-header">
            <div className="youth-auth-logo">
              <div className="youth-auth-logo-circle">
                <FaEnvelope />
              </div>
            </div>
            <h1 className="youth-auth-title">Forgot Password</h1>
            <p className="youth-auth-subtitle">Enter your email to receive a password reset code</p>
          </div>
          
          {error && (
            <div className="youth-auth-alert youth-auth-alert-danger">
              <div className="youth-auth-alert-icon">
                <FaExclamationTriangle />
              </div>
              <div className="youth-auth-alert-content">
                {error}
              </div>
            </div>
          )}
          
          {success && (
            <div className="youth-auth-alert youth-auth-alert-success">
              <div className="youth-auth-alert-icon">
                <FaCheck />
              </div>
              <div className="youth-auth-alert-content">
                {success}
              </div>
            </div>
          )}
          
          <form className="youth-auth-form" onSubmit={handleSubmit}>
            <div className="youth-auth-form-group">
              <label htmlFor="email" className="youth-auth-form-label">Email Address</label>
              <input
                type="email"
                id="email"
                className="youth-auth-form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                placeholder="Enter your registered email"
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="youth-auth-button"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Send Reset Instructions'}
            </button>
          </form>
          
          <div className="youth-auth-footer">
            <p>Remember your password? <NavLink to="/login">Back to Login</NavLink></p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;