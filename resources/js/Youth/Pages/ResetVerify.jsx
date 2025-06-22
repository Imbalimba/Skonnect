import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import background from '../../assets/home-banner.png';
import '../css/AuthStyles.css';
import { FaEnvelope, FaExclamationTriangle, FaCheck, FaRedo } from 'react-icons/fa';
import AuthLayout from '../Components/AuthLayout';
import { AuthContext } from '../../Contexts/AuthContext';

const ResetVerify = () => {
  const { pendingVerification, verifyOtp, resendOtp, getOtpStatus, clearPendingVerification } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for OTP inputs
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [remainingTime, setRemainingTime] = useState(300); // 5 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [shouldCheckStatus, setShouldCheckStatus] = useState(true);
  
  // Get email from location state or context
  const email = location.state?.email || (pendingVerification.purpose === 'reset' ? pendingVerification.email : '');
  const type = location.state?.type || (pendingVerification.purpose === 'reset' ? pendingVerification.type : 'youth_reset');
  
  // Create refs for the OTP inputs
  const inputRefs = useRef([]);
  // Create ref for tracking last time status was checked
  const lastStatusCheckRef = useRef(Date.now());
  // Timer reference to clean up
  const timerRef = useRef(null);
  
  // If no email, redirect to forgot password
  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);
  
  // Check OTP status and get remaining time from the server
  useEffect(() => {
    // Only make the API call if shouldCheckStatus is true
    if (!shouldCheckStatus || !email) return;
    
    const checkOtpStatus = async () => {
      try {
        // Throttle API calls - wait at least 3 seconds between checks
        const currentTime = Date.now();
        if (currentTime - lastStatusCheckRef.current < 3000) {
          return;
        }
        
        lastStatusCheckRef.current = currentTime;
        
        // Get OTP status from the server
        const result = await getOtpStatus(email, type);
        
        if (result.success) {
          // If there's an active OTP, update the timer
          if (result.hasActiveOtp) {
            setRemainingTime(Math.max(0, result.remainingTime));
            setCanResend(result.remainingTime <= 0);
          } else {
            // If no active OTP, allow resending
            setRemainingTime(0);
            setCanResend(true);
            
            // If this is the first load and no active OTP, send one
            if (!initialLoadDone) {
              handleResendCode(false);
            }
          }
        } else {
          // If error getting status, allow resending
          setRemainingTime(0);
          setCanResend(true);
        }
        
        // Mark initial load as done
        if (!initialLoadDone) {
          setInitialLoadDone(true);
        }
      } catch (err) {
        console.error('Error checking OTP status:', err);
        setCanResend(true);
      }
    };
    
    // Check once immediately
    checkOtpStatus();
    
    // Set up interval to periodically check OTP status (every 30 seconds)
    const statusInterval = setInterval(checkOtpStatus, 30000);
    
    return () => {
      clearInterval(statusInterval);
    };
  }, [email, getOtpStatus, initialLoadDone, shouldCheckStatus, type]);
  
  // Format remaining time as mm:ss
  const formatTime = (seconds) => {
    // Ensure seconds is a valid integer
    const validSeconds = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(validSeconds / 60);
    const secs = validSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Setup countdown timer (client-side)
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Only run timer if we have remaining time and time is greater than 0
    if (remainingTime <= 0) {
      setCanResend(true);
      return;
    }
    
    // Set the initial time when the timer starts
    const startTimeMs = Date.now();
    // Calculate the target end time
    const endTimeMs = startTimeMs + (remainingTime * 1000);
    
    // Start a new timer
    timerRef.current = setInterval(() => {
      const currentTimeMs = Date.now();
      const remainingMs = Math.max(0, endTimeMs - currentTimeMs);
      const newRemainingSeconds = Math.floor(remainingMs / 1000);
      
      // Update state only if the value has changed
      setRemainingTime(prevTime => {
        // Only update if the difference is at least 1 second
        if (Math.abs(prevTime - newRemainingSeconds) >= 1) {
          return newRemainingSeconds;
        }
        return prevTime;
      });
      
      // If timer has reached zero, clear interval and enable resend
      if (newRemainingSeconds <= 0) {
        clearInterval(timerRef.current);
        setCanResend(true);
        // This will trigger another check with the server to confirm the OTP is expired
        setShouldCheckStatus(true);
      }
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [remainingTime]);
  
  // Handle input change for OTP fields
  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d+$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Clear any previous errors
    if (error) setError('');
    
    // Auto-focus next input
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };
  
  // Handle key press for navigation between inputs
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      // Focus previous input when Backspace is pressed on an empty input
      inputRefs.current[index - 1].focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      // Navigate left
      inputRefs.current[index - 1].focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      // Navigate right
      inputRefs.current[index + 1].focus();
    }
  };
  
  // Handle paste event for OTP
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    
    // Check if pasted content is a 6-digit number
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      
      // Focus the last input
      inputRefs.current[5].focus();
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const otpCode = otp.join('');
    
    // Check if OTP is complete
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await verifyOtp(email, otpCode, type.replace('_reset', ''), 'reset');
      
      if (result.success) {
        setSuccess('Verification successful. Proceed to set a new password.');
        
        // Stop checking status once verified
        setShouldCheckStatus(false);
        
        // Redirect to reset password page
        setTimeout(() => {
          navigate('/reset-password', { 
            state: { 
              email,
              code: otpCode,
              type
            } 
          });
        }, 1500);
      } else {
        if (result.isExpired) {
          setError('This verification code has expired. Please request a new one.');
          setCanResend(true);
          setRemainingTime(0);
        } else {
          setError(result.message || 'Invalid verification code. Please try again.');
        }
      }
    } catch (err) {
      setError('An error occurred during verification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle resend verification code
  const handleResendCode = async (force = true) => {
    if (!canResend && force) return;
    
    setIsResending(true);
    setError('');
    
    try {
      const result = await resendOtp(email, type.replace('_reset', ''), force, 'reset');
      
      if (result.success) {
        // Convert remaining time to integer and ensure it's valid
        const newRemainingTime = parseInt(result.remainingTime) || 0;
        
        if (newRemainingTime > 0) {
          setSuccess('Your verification code is still valid.');
          setRemainingTime(newRemainingTime);
        } else {
          setSuccess('A new verification code has been sent to your email.');
          setRemainingTime(300); // Reset timer to 5 minutes
        }
        
        setCanResend(false);
        
        // Clear success message after a delay
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        setError(result.message || 'Failed to resend verification code. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };
  
  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      // Clear any timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

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
            <h1 className="youth-auth-title">Verify Your Identity</h1>
            <p className="youth-auth-subtitle">Enter the code sent to {email}</p>
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
            <div className="youth-auth-otp-container">
              <p className="youth-auth-otp-instruction">Enter the 6-digit verification code sent to your email:</p>
              
              <div className="youth-auth-otp-inputs">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => inputRefs.current[index] = el}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="youth-auth-otp-input"
                    disabled={isLoading}
                    autoFocus={index === 0}
                    required
                  />
                ))}
              </div>
              
              <div className="youth-auth-otp-timer">
                <span>Code expires in: </span>
                <span className={canResend ? 'youth-auth-timer-expired' : 'youth-auth-timer-active'}>
                  {formatTime(remainingTime)}
                </span>
              </div>
              
              <button 
                type="button" 
                className={`youth-auth-resend-button ${canResend ? '' : 'youth-auth-resend-disabled'}`}
                onClick={() => handleResendCode(true)}
                disabled={!canResend || isResending}
              >
                <FaRedo className={isResending ? 'youth-auth-spin' : ''} />
                {isResending ? 'Sending...' : 'Resend Code'}
              </button>
            </div>
            
            <button 
              type="submit" 
              className="youth-auth-button"
              disabled={isLoading || otp.some(digit => digit === '')}
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
          
          <div className="youth-auth-footer">
            <p>Didn't receive code? Check your spam folder or <button 
                onClick={() => handleResendCode(true)}
                className="youth-auth-inline-link"
                disabled={!canResend || isResending}
              >
                request a new one
              </button>
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ResetVerify;