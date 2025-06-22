import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import background from '../../assets/home-banner.png';
import '../css/AuthStyles.css';
import { FaUser, FaExclamationTriangle, FaEye, FaEyeSlash } from 'react-icons/fa';
import AuthLayout from '../Components/AuthLayout';
import { AuthContext } from '../../Contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { user, login } = useContext(AuthContext);
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Validate email format
  const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };
  
  // Check if the form is valid
  useEffect(() => {
    const isValid = 
      formData.email.trim() !== '' && 
      validateEmail(formData.email) && 
      formData.password.trim() !== '' &&
      formData.password.length >= 6 &&
      errors.email === '' && 
      errors.password === '';
    
    setIsFormValid(isValid);
  }, [formData, errors]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData({
      ...formData,
      [name]: newValue
    });
    
    // Validate on change
    validateField(name, newValue);
  };
  
  const validateField = (name, value) => {
    let errorMessage = '';
    
    switch (name) {
      case 'email':
        if (value.trim() === '') {
          errorMessage = 'Email is required';
        } else if (!validateEmail(value)) {
          errorMessage = 'E-mail is invalid!';
        }
        break;
      case 'password':
        if (value.trim() === '') {
          errorMessage = 'Password is required';
        } else if (value.length < 6) {
          errorMessage = 'Password must be at least 6 characters';
        }
        break;
      default:
        break;
    }
    
    setErrors(prev => ({
      ...prev,
      [name]: errorMessage
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if the form is valid
    if (!isFormValid) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Use the context's login function
      const { success, error } = await login(
        formData.email,
        formData.password,
        formData.rememberMe
      );
      
      // Handle successful login
      if (success) {
        // Redirect to home page or dashboard
        navigate('/');
      } else {
        // Handle login error
        setShowAlert(true);
        setAlertMessage(error || 'Invalid credentials. Please try again.');
      }
    } catch (error) {
      // Handle unexpected errors
      setShowAlert(true);
      setAlertMessage('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // If already logged in, don't render the form (will redirect via useEffect)
  if (user) {
    return <div className="youth-auth-loading">Redirecting...</div>;
  }

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
                <FaUser />
              </div>
            </div>
            <h1 className="youth-auth-title">Welcome Back!</h1>
            <p className="youth-auth-subtitle">Sign in to your account</p>
          </div>
          
          {showAlert && (
            <div className="youth-auth-alert youth-auth-alert-danger">
              <div className="youth-auth-alert-icon">
                <FaExclamationTriangle />
              </div>
              <div className="youth-auth-alert-content">
                {alertMessage}
              </div>
            </div>
          )}
          
          <form className="youth-auth-form" onSubmit={handleSubmit}>
            <div className="youth-auth-form-group">
              <label htmlFor="email" className="youth-auth-form-label">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                className={`youth-auth-form-input ${errors.email ? 'error' : ''}`}
                value={formData.email}
                onChange={handleChange}
                onBlur={(e) => validateField('email', e.target.value)}
                disabled={isLoading}
                required
              />
              {errors.email && <span className="youth-auth-input-error">{errors.email}</span>}
            </div>
            
            <div className="youth-auth-form-group">
              <label htmlFor="password" className="youth-auth-form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className={`youth-auth-form-input ${errors.password ? 'error' : ''}`}
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={(e) => validateField('password', e.target.value)}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
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
              {errors.password && <span className="youth-auth-input-error">{errors.password}</span>}
            </div>
            
            <div className="youth-auth-form-options">
              <label className="youth-auth-form-check">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <span>Remember me</span>
              </label>
              
              <NavLink to="/forgot-password" className="youth-auth-form-link">Forgot password?</NavLink>
            </div>
            
            <button 
              type="submit" 
              className="youth-auth-button"
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
          
          <div className="youth-auth-footer">
            <p>Don't have an account? <NavLink to="/signup">Create Account</NavLink></p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;