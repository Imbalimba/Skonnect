import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import background from '../../assets/home-banner.png';
import '../css/AuthStyles.css';
import { FaKey, FaExclamationTriangle, FaCheck, FaEye, FaEyeSlash } from 'react-icons/fa';
import AuthLayout from '../Components/AuthLayout';
import { AuthContext } from '../../Contexts/AuthContext';

const ResetPassword = () => {
  const { resetPasswordYouth } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get data from location state
  const email = location.state?.email;
  const code = location.state?.code;
  const type = location.state?.type;
  
  // Form state
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasLower: false,
    hasUpper: false,
    hasSpecial: false,
    hasNumber: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [shouldShowRequirements, setShouldShowRequirements] = useState(false);
  
  // If missing required data, redirect to forgot password
  useEffect(() => {
    if (!email || !code) {
      navigate('/forgot-password');
    }
  }, [email, code, navigate]);
  
  // Check password requirements
  useEffect(() => {
    const { password } = formData;
    
    setPasswordRequirements({
      minLength: password.length >= 8,
      hasLower: /[a-z]/.test(password),
      hasUpper: /[A-Z]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      hasNumber: /[0-9]/.test(password)
    });
    
    // Only show requirements if there's actual content in the password field
    setShouldShowRequirements(password.length > 0 || passwordFocused);
  }, [formData.password, passwordFocused]);
  
  // Check if the form is valid
  useEffect(() => {
    // Check if passwords match and meet requirements
    const passwordValid = Object.values(passwordRequirements).every(req => req);
    const passwordsMatch = formData.password === formData.confirmPassword && formData.password.length > 0;
    
    setIsFormValid(passwordValid && passwordsMatch);
  }, [formData, passwordRequirements]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear errors when typing
    if (error) setError('');
  };
  
  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };
  
  const handlePasswordFocus = () => {
    setPasswordFocused(true);
  };

  const handlePasswordBlur = () => {
    setPasswordFocused(false);
    
    // If the password field is empty when the user leaves, hide requirements
    if (formData.password.trim() === '') {
      setShouldShowRequirements(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!isFormValid) {
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await resetPasswordYouth(
        email,
        code,
        formData.password,
        formData.confirmPassword
      );
      
      if (result.success) {
        setSuccess(result.message || 'Your password has been reset successfully!');
        
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(result.message || 'Failed to reset password. Please try again.');
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
                <FaKey />
              </div>
            </div>
            <h1 className="youth-auth-title">Create New Password</h1>
            <p className="youth-auth-subtitle">Please set your new password</p>
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
              <label htmlFor="password" className="youth-auth-form-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className="youth-auth-form-input"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={handlePasswordFocus}
                  onBlur={handlePasswordBlur}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('password')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              
              {/* Password requirements */}
              {shouldShowRequirements && (
                <div className="youth-auth-password-requirements">
                  <div className={`youth-auth-password-requirement ${passwordRequirements.minLength ? 'valid' : 'invalid'}`}>
                    {passwordRequirements.minLength ? <FaCheck /> : <FaExclamationTriangle />}
                    <span>Use at least 8 characters</span>
                  </div>
                  <div className={`youth-auth-password-requirement ${passwordRequirements.hasLower ? 'valid' : 'invalid'}`}>
                    {passwordRequirements.hasLower ? <FaCheck /> : <FaExclamationTriangle />}
                    <span>Use a lowercase letter</span>
                  </div>
                  <div className={`youth-auth-password-requirement ${passwordRequirements.hasUpper ? 'valid' : 'invalid'}`}>
                    {passwordRequirements.hasUpper ? <FaCheck /> : <FaExclamationTriangle />}
                    <span>Use an uppercase letter</span>
                  </div>
                  <div className={`youth-auth-password-requirement ${passwordRequirements.hasSpecial ? 'valid' : 'invalid'}`}>
                    {passwordRequirements.hasSpecial ? <FaCheck /> : <FaExclamationTriangle />}
                    <span>Use at least 1 special character (!@#$...)</span>
                  </div>
                  <div className={`youth-auth-password-requirement ${passwordRequirements.hasNumber ? 'valid' : 'invalid'}`}>
                    {passwordRequirements.hasNumber ? <FaCheck /> : <FaExclamationTriangle />}
                    <span>Use at least 1 number</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="youth-auth-form-group">
              <label htmlFor="confirmPassword" className="youth-auth-form-label">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  className="youth-auth-form-input"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <span className="youth-auth-input-error">Passwords do not match</span>
              )}
            </div>
            
            <button 
              type="submit" 
              className="youth-auth-button"
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
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

export default ResetPassword;