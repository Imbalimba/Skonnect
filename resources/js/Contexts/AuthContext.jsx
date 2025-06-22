import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import LogService from '../services/LogService'; // Import the LogService

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [skUser, setSkUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State for email verification and password reset
  const [pendingVerification, setPendingVerification] = useState({
    email: '',
    type: '', // 'youth' or 'sk'
    waiting: false,
    purpose: 'verification' // 'verification' or 'reset'
  });

  const [pending2FA, setPending2FA] = useState({
    email: '',
    waiting: false
  });

  // Check auth status when the app loads
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Also update checkAuthStatus to handle pending2FA correctly
  const checkAuthStatus = async () => {
    try {
      // Check regular user auth status
      const response = await axios.get('/user');
      if (response.data.authenticated) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
      
      // Also check SK user auth status
      const skResponse = await axios.get('/sk-user');
      if (skResponse.data.authenticated) {
        setSkUser(skResponse.data.user);
        
        // If we have a valid SK user session, ensure pending2FA is cleared
        setPending2FA({
          email: '',
          waiting: false
        });
      } else {
        setSkUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setSkUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Regular user authentication functions
  const login = async (email, password, rememberMe) => {
    try {
      await axios.get('/sanctum/csrf-cookie');
      const response = await axios.post('/login', { email, password, rememberMe });
      
      if (response.data.success) {
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      }
      
      return { success: true, user: response.data.user };
    } catch (error) {
      // Since verification check is removed on backend, this block will only 
      // trigger for actual auth errors, not verification issues
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };
  
  const logout = async () => {
    try {
      await axios.post('/logout');
      setUser(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Logout failed' };
    }
  };

  // In AuthContext.jsx
  const register = async (userData) => {
    try {
      await axios.get('/sanctum/csrf-cookie');
      
      // Configure headers for FormData if needed
      let config = {};
      if (userData instanceof FormData) {
        config = {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        };
      }
      
      const response = await axios.post('/register', userData, config);
      
      if (response.data.success) {
        if (response.data.needsVerification) {
          setPendingVerification({
            email: userData instanceof FormData ? userData.get('email') : userData.email,
            type: 'youth',
            waiting: true,
            purpose: 'verification'
          });
        }
        return { success: true, needsVerification: response.data.needsVerification };
      }
    } catch (error) {
      return { 
        success: false, 
        errors: error.response?.data?.errors || { general: ['Registration failed'] }
      };
    }
  };

  // Update the skLogin function
  const skLogin = async (email, password) => {
    try {
      await axios.get('/sanctum/csrf-cookie');
      const response = await axios.post('/sk-login', { email, password });
      
      if (response.data.success) {
        if (response.data.needs2FA) {
          // Set pending 2FA state
          setPending2FA({
            email: response.data.email,
            waiting: true
          });
          
          // Log 2FA prompt
          await LogService.logAction('2fa_prompt', `2FA prompted for: ${email}`);
          
          return { 
            success: true, 
            needs2FA: true,
            email: response.data.email,
            message: response.data.message
          };
        }
        
        // If no 2FA needed (shouldn't happen with new flow)
        setSkUser(response.data.user);
        
        // Log successful login
        await LogService.logLogin(response.data.user.id, email);
        
        return { success: true };
      }
    } catch (error) {
      // Check for eligibility issues
      if (error.response?.status === 403 && error.response?.data?.eligibility_issues) {
        // Log eligibility issues
        await LogService.logAction(
          'login_eligibility_issue', 
          `Login eligibility issues for: ${error.response.data.email}`,
          null,
          'sk-login'
        );
        
        return {
          success: false,
          eligibility_issues: error.response.data.eligibility_issues,
          email: error.response.data.email,
          error: 'Account eligibility issues'
        };
      }
      
      // Check for verification and authentication status
      if (error.response?.status === 403) {
        const data = error.response.data;
        
        // Set pending verification if needed
        if (data.verified === false) {
          setPendingVerification({
            email: data.email,
            type: 'sk',
            waiting: true,
            purpose: 'verification'
          });
          
          // Log verification needed
          await LogService.logAction(
            'verification_needed', 
            `Email verification needed for: ${data.email}`,
            null,
            'sk-login'
          );
        } else {
          // Log authentication needed
          await LogService.logAction(
            'authentication_needed', 
            `Admin authentication needed for: ${data.email}`,
            null,
            'sk-login'
          );
        }
        
        return { 
          success: false, 
          verified: data.verified === true,
          authenticated: data.authenticated === true,
          email: data.email,
          error: data.message || 'Please complete the verification and authentication process.'
        };
      }
      
      // Log failed login
      await LogService.logAction(
        'login_failed',
        `Failed login attempt for: ${email}`,
        null,
        'sk-login'
      );
      
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  // Update verify2FA function in AuthContext.jsx to avoid race conditions
  const verify2FA = async (email, code) => {
    try {
      const response = await axios.post('/sk-verify-2fa', { email, code });
      
      if (response.data.success) {
        // Set user in state FIRST before clearing pending2FA
        setSkUser(response.data.user);
        
        // Log successful 2FA verification
        await LogService.log2FAVerification(response.data.user.id, email);
        
        // Add a small delay before clearing pending2FA to avoid race conditions
        setTimeout(() => {
          // Clear pending 2FA state
          setPending2FA({
            email: '',
            waiting: false
          });
        }, 100);
        
        return { success: true, message: response.data.message };
      }
      
      // Log failed 2FA
      await LogService.logAction(
        '2fa_failed',
        `Failed 2FA attempt for: ${email}`,
        null,
        'sk-2fa-verify'
      );
      
      return { 
        success: false, 
        message: response.data.message,
        isExpired: response.data.isExpired || false
      };
    } catch (err) {
      // Log error
      await LogService.logAction(
        '2fa_error',
        `2FA error for: ${email}`,
        null,
        'sk-2fa-verify'
      );
      
      return {
        success: false,
        isExpired: err.response?.data?.isExpired || false,
        message: err.response?.data?.message || 'Verification failed. Please try again.'
      };
    }
  };

  // Add resend2FA function
  const resend2FA = async (email, force = true) => {
    try {
      const response = await axios.post('/sk-resend-2fa', { email, force });
      
      if (response.data.success) {
        return { 
          success: true, 
          message: response.data.message,
          remainingTime: parseInt(response.data.remaining_time) || 0
        };
      }
      
      return { success: false, message: response.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to resend verification code.'
      };
    }
  };

  // Add get2FAStatus function
  const get2FAStatus = async (email) => {
    try {
      const response = await axios.post('/sk-get-2fa-status', { email });
      
      if (response.data.success) {
        return { 
          success: true, 
          hasActiveOtp: response.data.has_active_otp,
          remainingTime: response.data.remaining_time 
        };
      }
      
      return { success: false, hasActiveOtp: false, remainingTime: 0 };
    } catch (err) {
      return { success: false, hasActiveOtp: false, remainingTime: 0 };
    }
  };

  // Add clearPending2FA function
  const clearPending2FA = () => {
    setPending2FA({
      email: '',
      waiting: false
    });
  };

  const skLogout = async () => {
    try {
      // Log logout first in case the session is destroyed
      if (skUser) {
        await LogService.logLogout(skUser.id);
      }
      
      await axios.post('/sk-logout');
      setSkUser(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Logout failed' };
    }
  };

  const skRegister = async (userData) => {
    try {
      await axios.get('/sanctum/csrf-cookie');
      
      // If userData is FormData, it's already properly formatted
      // Otherwise, create a new FormData object
      let formData = userData;
      if (!(userData instanceof FormData)) {
        formData = new FormData();
        for (const key in userData) {
          formData.append(key, userData[key]);
        }
      }
      
      const response = await axios.post('/sk-register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        // Log signup
        const email = userData instanceof FormData ? userData.get('email') : userData.email;
        await LogService.logSignup(response.data.user.id, email);
        
        if (response.data.needsVerification) {
          setPendingVerification({
            email: email,
            type: 'sk',
            waiting: true,
            purpose: 'verification'
          });
        }
        return { success: true, needsVerification: response.data.needsVerification };
      } else {
        // Handle case where response exists but success is false
        return { 
          success: false, 
          errors: response.data.errors || { general: ['Registration failed'] }
        };
      }
    } catch (error) {
      console.error('SK Registration error:', error);
      
      // Improved error handling with debugging info
      return { 
        success: false, 
        errors: error.response?.data?.errors || { 
          general: [error.response?.data?.message || 'Registration failed. Please try again.'] 
        }
      };
    }
  };
  
  // Get OTP status and remaining time (used for both verification and password reset)
  const getOtpStatus = async (email, type) => {
    try {
      let endpoint = '';
      
      // Determine which endpoint to use based on type and purpose
      if (type === 'youth') {
        endpoint = '/get-otp-status';
      } else if (type === 'sk') {
        endpoint = '/sk-get-otp-status';
      } else if (type === 'youth_reset') {
        endpoint = '/get-reset-otp-status';
      } else if (type === 'sk_reset') {
        endpoint = '/sk-get-reset-otp-status';
      }
      
      const response = await axios.post(endpoint, { email }, {
        // Add timeout to prevent hanging requests
        timeout: 5000
      });
      
      if (response.data.success) {
        return { 
          success: true, 
          hasActiveOtp: response.data.has_active_otp,
          remainingTime: response.data.remaining_time 
        };
      }
      
      return { success: false, hasActiveOtp: false, remainingTime: 0 };
    } catch (error) {
      // More informative error logging
      if (error.code === 'ECONNABORTED') {
        console.error('OTP status request timed out');
      } else if (error.message === 'Network Error') {
        console.error('Network error when checking OTP status');
      } else {
        console.error('Error getting OTP status:', error);
      }
      
      return { success: false, hasActiveOtp: false, remainingTime: 0 };
    }
  };
  
  // OTP verification functions (used for both account verification and password reset)
  // Update verifyOtp function with logging
  const verifyOtp = async (email, code, type, purpose = 'verification') => {
    try {
      let endpoint = '';
      
      // Determine which endpoint to use based on type and purpose
      if (purpose === 'verification') {
        endpoint = type === 'youth' ? '/verify-otp' : '/sk-verify-otp';
      } else {
        endpoint = type === 'youth' ? '/verify-reset-otp' : '/sk-verify-reset-otp';
      }
      
      const response = await axios.post(endpoint, { email, code });
      
      if (response.data.success) {
        // Log successful verification
        if (purpose === 'verification') {
          // Log email verification
          await LogService.logEmailVerification(null, email);
          
          // Only clear pending verification for email verification, not password reset
          setPendingVerification({
            email: '',
            type: '',
            waiting: false,
            purpose: 'verification'
          });
        } else {
          // Log successful OTP verification for password reset
          await LogService.logAction(
            'reset_otp_verified',
            `Password reset OTP verified for: ${email}`,
            null,
            'sk-reset-verify'
          );
        }
        
        return { success: true, message: response.data.message, email: response.data.email || email };
      }
      
      // Log failed verification
      await LogService.logAction(
        purpose === 'verification' ? 'verification_failed' : 'reset_otp_failed',
        `${purpose === 'verification' ? 'Email verification' : 'Password reset verification'} failed for: ${email}`,
        null,
        purpose === 'verification' ? 'sk-verify-email' : 'sk-reset-verify'
      );
      
      return { success: false, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        isExpired: error.response?.data?.isExpired || false,
        message: error.response?.data?.message || 'Verification failed. Please try again.'
      };
    }
  };
  
  // Resend OTP (used for both account verification and password reset)
  const resendOtp = async (email, type, force = false, purpose = 'verification') => {
    try {
      let endpoint = '';
      
      // Determine which endpoint to use based on type and purpose
      if (purpose === 'verification') {
        endpoint = type === 'youth' ? '/resend-otp' : '/sk-resend-otp';
      } else {
        endpoint = type === 'youth' ? '/resend-reset-otp' : '/sk-resend-reset-otp';
      }
      
      const response = await axios.post(endpoint, { email, force });
      
      if (response.data.success) {
        return { 
          success: true, 
          message: response.data.message,
          remainingTime: parseInt(response.data.remaining_time) || 0
        };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to resend verification code.'
      };
    }
  };
  
  // Forgot password function for youth
  const forgotPasswordYouth = async (email) => {
    try {
      const response = await axios.post('/forgot-password', { email });
      
      if (response.data.success) {
        setPendingVerification({
          email: email,
          type: 'youth_reset',
          waiting: true,
          purpose: 'reset'
        });
        
        return { 
          success: true, 
          message: response.data.message
        };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      // Check if it's a validation error (user not found)
      if (error.response?.status === 422) {
        return {
          success: false,
          message: 'We could not find a user with that email address.'
        };
      }
      
      // Check if it's a rate limiting error
      if (error.response?.status === 429) {
        return {
          success: false,
          message: 'Too many password reset attempts. Please try again later.'
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to process forgot password request.'
      };
    }
  };
  
   // Update forgotPasswordSk function with logging
   const forgotPasswordSk = async (email) => {
    try {
      const response = await axios.post('/sk-forgot-password', { email });
      
      if (response.data.success) {
        // Log forgot password request
        await LogService.logForgotPassword(email);
        
        setPendingVerification({
          email: email,
          type: 'sk_reset',
          waiting: true,
          purpose: 'reset'
        });
        
        return { 
          success: true, 
          message: response.data.message
        };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      // Check if it's a validation error (user not found)
      if (error.response?.status === 422) {
        // Log user not found
        await LogService.logAction(
          'forgot_password_user_not_found',
          `Password reset requested for non-existent email: ${email}`,
          null,
          'sk-forgot-password'
        );
        
        return {
          success: false,
          message: 'We could not find a user with that email address.'
        };
      }
      
      // Check if it's a rate limiting error
      if (error.response?.status === 429) {
        // Log rate limit
        await LogService.logAction(
          'forgot_password_rate_limit',
          `Password reset rate limit reached for: ${email}`,
          null,
          'sk-forgot-password'
        );
        
        return {
          success: false,
          message: 'Too many password reset attempts. Please try again later.'
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to process forgot password request.'
      };
    }
  };
  
  // Reset password function for youth
  const resetPasswordYouth = async (email, code, password, passwordConfirmation) => {
    try {
      const response = await axios.post('/reset-password', {
        email,
        code,
        password,
        password_confirmation: passwordConfirmation
      });
      
      if (response.data.success) {
        // Clear pending verification state for password reset
        setPendingVerification({
          email: '',
          type: '',
          waiting: false,
          purpose: 'verification' // Reset to default
        });
        
        return { success: true, message: response.data.message };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      // Handle validation errors
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors;
        let errorMessage = 'Validation failed:';
        
        for (const field in validationErrors) {
          errorMessage += ` ${validationErrors[field].join(', ')}`;
        }
        
        return {
          success: false,
          message: errorMessage
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to reset password. Please try again.'
      };
    }
  };
  
  // Update resetPasswordSk function with logging
  const resetPasswordSk = async (email, code, password, passwordConfirmation) => {
    try {
      const response = await axios.post('/sk-reset-password', {
        email,
        code,
        password,
        password_confirmation: passwordConfirmation
      });
      
      if (response.data.success) {
        // Log password reset
        await LogService.logPasswordReset(null, email);
        
        // Clear pending verification state for password reset
        setPendingVerification({
          email: '',
          type: '',
          waiting: false,
          purpose: 'verification' // Reset to default
        });
        
        return { success: true, message: response.data.message };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      // Handle validation errors
      if (error.response?.status === 422) {
        // Log validation error
        await LogService.logAction(
          'password_reset_validation_error',
          `Password reset validation error for: ${email}`,
          null,
          'sk-reset-password'
        );
        
        const validationErrors = error.response.data.errors;
        let errorMessage = 'Validation failed:';
        
        for (const field in validationErrors) {
          errorMessage += ` ${validationErrors[field].join(', ')}`;
        }
        
        return {
          success: false,
          message: errorMessage
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to reset password. Please try again.'
      };
    }
  };
  
  // Clear pending verification state
  const clearPendingVerification = () => {
    setPendingVerification({
      email: '',
      type: '',
      waiting: false,
      purpose: 'verification'
    });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      skUser,
      loading, 
      login, 
      logout, 
      register, 
      skLogin,
      skLogout,
      skRegister,
      checkAuthStatus,
      // Email verification related
      pendingVerification,
      verifyOtp,
      resendOtp,
      getOtpStatus,
      clearPendingVerification,
      // 2FA related
      pending2FA,
      verify2FA,
      resend2FA,
      get2FAStatus,
      clearPending2FA,
      // Password reset related
      forgotPasswordYouth,
      forgotPasswordSk,
      resetPasswordYouth,
      resetPasswordSk
    }}>
      {children}
    </AuthContext.Provider>
  );
};