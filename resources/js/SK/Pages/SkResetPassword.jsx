import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../css/SkStyles.css';
import bgImage from '../images/background.png';
import skLogo from '../images/profile.png';
import { AuthContext } from '../../Contexts/AuthContext';

const SkResetPassword = () => {
  const { resetPasswordSk } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get data from location state
  const email = location.state?.email;
  const code = location.state?.code;
  const type = location.state?.type;
  
  // Password state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Password requirements state
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasLower: false,
    hasUpper: false,
    hasSpecial: false,
    hasNumber: false
  });
  
  // Check if we have all required information
  useEffect(() => {
    if (!email || !code) {
      navigate('/sk-forgot-password');
    }
  }, [email, code, navigate]);
  
  // Check password requirements
  useEffect(() => {
    setPasswordRequirements({
      minLength: password.length >= 8,
      hasLower: /[a-z]/.test(password),
      hasUpper: /[A-Z]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      hasNumber: /[0-9]/.test(password)
    });
  }, [password]);
  
  // Check if form is valid
  const isFormValid = () => {
    return (
      password === confirmPassword &&
      password.length > 0 &&
      Object.values(passwordRequirements).every(req => req)
    );
  };
  
  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if passwords match and meet requirements
    if (!isFormValid()) {
      setError('Please ensure your password meets all requirements and both passwords match.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await resetPasswordSk(
        email,
        code,
        password,
        confirmPassword
      );
      
      if (result.success) {
        setSuccess(result.message || 'Your password has been reset successfully!');
        
        // Redirect to login after a delay
        setTimeout(() => {
          navigate('/sk-login');
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
    <div className="sk-cmn-sklcss-container">
      <div className="sk-cmn-sklcss-content">
        <img src={bgImage} alt="Background" className="sk-cmn-sklcss-background" />
        
        <div className="sk-cmn-sklcss-card">
          <div className="sk-cmn-sklcss-card-header">
            <img src={skLogo} alt="SK Logo" className="sk-cmn-sklcss-profile-icon" />
            <h2>Create New Password</h2>
          </div>
          
          <div className="sk-cmn-sklcss-card-body">
            <p className="text-center">Please set your new password for your SK account.</p>
            
            {error && <div className="sk-cmn-sklcss-alert sk-cmn-sklcss-alert-danger">{error}</div>}
            {success && <div className="sk-cmn-sklcss-alert sk-cmn-sklcss-alert-success">{success}</div>}
            
            <form className="sk-cmn-sklcss-form" onSubmit={handleSubmit}>
              <div className="sk-cmn-sklcss-form-group">
                <label htmlFor="password" className="sk-cmn-sklcss-form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    id="password"
                    className="sk-cmn-sklcss-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                    {showPassword ? <i className="fas fa-eye-slash"></i> : <i className="fas fa-eye"></i>}
                  </button>
                </div>
                
                {/* Password requirements */}
                {password.length > 0 && (
                  <div style={{ marginTop: '10px', fontSize: '0.85rem' }}>
                    <div style={{ color: passwordRequirements.minLength ? '#27ae60' : '#e74c3c', marginBottom: '5px' }}>
                      <i className={`fas ${passwordRequirements.minLength ? 'fa-check' : 'fa-times'}`}></i>
                      <span style={{ marginLeft: '5px' }}>At least 8 characters</span>
                    </div>
                    <div style={{ color: passwordRequirements.hasLower ? '#27ae60' : '#e74c3c', marginBottom: '5px' }}>
                      <i className={`fas ${passwordRequirements.hasLower ? 'fa-check' : 'fa-times'}`}></i>
                      <span style={{ marginLeft: '5px' }}>One lowercase letter</span>
                    </div>
                    <div style={{ color: passwordRequirements.hasUpper ? '#27ae60' : '#e74c3c', marginBottom: '5px' }}>
                      <i className={`fas ${passwordRequirements.hasUpper ? 'fa-check' : 'fa-times'}`}></i>
                      <span style={{ marginLeft: '5px' }}>One uppercase letter</span>
                    </div>
                    <div style={{ color: passwordRequirements.hasNumber ? '#27ae60' : '#e74c3c', marginBottom: '5px' }}>
                      <i className={`fas ${passwordRequirements.hasNumber ? 'fa-check' : 'fa-times'}`}></i>
                      <span style={{ marginLeft: '5px' }}>One number</span>
                    </div>
                    <div style={{ color: passwordRequirements.hasSpecial ? '#27ae60' : '#e74c3c' }}>
                      <i className={`fas ${passwordRequirements.hasSpecial ? 'fa-check' : 'fa-times'}`}></i>
                      <span style={{ marginLeft: '5px' }}>One special character</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="sk-cmn-sklcss-form-group">
                <label htmlFor="confirmPassword" className="sk-cmn-sklcss-form-label">Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    id="confirmPassword"
                    className="sk-cmn-sklcss-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                    {showConfirmPassword ? <i className="fas fa-eye-slash"></i> : <i className="fas fa-eye"></i>}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <div className="sk-cmn-sklcss-error" style={{ marginTop: '5px' }}>Passwords do not match</div>
                )}
              </div>
              
              <button 
                type="submit" 
                className="sk-cmn-sklcss-button sk-cmn-sklcss-button-primary sk-cmn-sklcss-button-full"
                disabled={isLoading || !isFormValid()}
              >
                {isLoading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
            
            <p className="sk-cmn-sklcss-text-center sk-cmn-sklcss-mt-3">
              Remember your password? 
              <a href="/sk-login" className="sk-cmn-sklcss-link"> Back to Login</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkResetPassword;