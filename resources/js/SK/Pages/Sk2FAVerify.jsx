import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../css/SkStyles.css';
import bgImage from '../images/background.png';
import skLogo from '../images/profile.png';
import { AuthContext } from '../../Contexts/AuthContext';
import { FaExclamationTriangle, FaCheck, FaRedo } from 'react-icons/fa';

const Sk2FAVerify = () => {
  const { pending2FA, verify2FA, resend2FA, get2FAStatus, clearPending2FA } = useContext(AuthContext);
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
  const email = location.state?.email || pending2FA.email;
  
  // Create refs for the OTP inputs
  const inputRefs = useRef([]);
  // Create ref for tracking last time status was checked
  const lastStatusCheckRef = useRef(Date.now());
  // Timer reference to clean up
  const timerRef = useRef(null);
  
  // If no email, redirect to login
  useEffect(() => {
    if (!email && !pending2FA.waiting) {
      navigate('/sk-login');
    }
  }, [email, pending2FA, navigate]);
  
  // Check 2FA status and get remaining time from the server
  useEffect(() => {
    // Only make the API call if shouldCheckStatus is true
    if (!shouldCheckStatus || !email) return;
    
    const check2FAStatus = async () => {
      try {
        // Throttle API calls - wait at least 3 seconds between checks
        const currentTime = Date.now();
        if (currentTime - lastStatusCheckRef.current < 3000) {
          return;
        }
        
        lastStatusCheckRef.current = currentTime;
        
        // Get 2FA status from the server
        const result = await get2FAStatus(email);
        
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
        console.error('Error checking 2FA status:', err);
        setCanResend(true);
      }
    };
    
    // Check once immediately
    check2FAStatus();
    
    // Set up interval to periodically check 2FA status (every 30 seconds)
    const statusInterval = setInterval(check2FAStatus, 30000);
    
    return () => {
      clearInterval(statusInterval);
    };
  }, [email, get2FAStatus, initialLoadDone, shouldCheckStatus]);
  
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
  
  // Update the handleSubmit function in Sk2FAVerify.jsx
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
      const result = await verify2FA(email, otpCode);
      
      if (result.success) {
        setSuccess('Two-factor authentication successful!');
        
        // Stop checking status once verified
        setShouldCheckStatus(false);
        
        // Force clear pending 2FA immediately
        clearPending2FA();
        
        // Use window.location for a FULL page reload instead of React Router navigation
        // This ensures proper state reset and prevents going back to this page
        setTimeout(() => {
          window.location.href = '/dashboard';
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
      const result = await resend2FA(email, force);
      
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
      // Clear any pending 2FA state
      clearPending2FA();
      
      // Clear any timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [clearPending2FA]);

  // Add this useEffect to Sk2FAVerify.jsx to prevent going back after successful verification
  useEffect(() => {
    // This prevents the user from using browser back button to return to the 2FA page
    const preventBack = (e) => {
      if (!pending2FA.waiting) {
        window.history.forward();
      }
    };
  
    window.history.pushState(null, null, window.location.href);
    window.addEventListener('popstate', preventBack);
  
    return () => {
      window.removeEventListener('popstate', preventBack);
    };
  }, [pending2FA.waiting]);

  return (
    <div className="sk-cmn-sklcss-container">      
      <div className="sk-cmn-sklcss-content">
        <img src={bgImage} alt="Background" className="sk-cmn-sklcss-background" />
        
        <div className="sk-cmn-sklcss-card">
          <div className="sk-cmn-sklcss-card-header">
            <img src={skLogo} alt="SK Logo" className="sk-cmn-sklcss-profile-icon" />
            <h2>Two-Factor Authentication</h2>
          </div>
          
          <div className="sk-cmn-sklcss-card-body">
            <p className="text-center">
              For added security, please verify your identity by entering the code sent to <strong>{email}</strong>
            </p>
            
            {error && (
              <div className="sk-cmn-sklcss-alert sk-cmn-sklcss-alert-danger">
                {error}
              </div>
            )}
            
            {success && (
              <div className="sk-cmn-sklcss-alert sk-cmn-sklcss-alert-success">
                {success}
              </div>
            )}
            
            <form className="sk-cmn-sklcss-form" onSubmit={handleSubmit}>
              <p className="sk-cmn-sklcss-form-label text-center">Enter the 6-digit verification code:</p>
              
              <div className="sk-cmn-sklcss-otp-inputs">
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
                    className="sk-cmn-sklcss-otp-input"
                    disabled={isLoading}
                    autoFocus={index === 0}
                    required
                  />
                ))}
              </div>
              
              <div className="sk-cmn-sklcss-otp-timer">
                <span>Code expires in: </span>
                <span className={canResend ? 'sk-cmn-sklcss-timer-expired' : 'sk-cmn-sklcss-timer-active'}>
                  {formatTime(remainingTime)}
                </span>
              </div>
              
              <button 
                type="button" 
                className={`sk-cmn-sklcss-resend-button ${canResend ? '' : 'sk-cmn-sklcss-resend-disabled'}`}
                onClick={() => handleResendCode(true)}
                disabled={!canResend || isResending}
              >
                {isResending ? 'Sending...' : 'Resend Code'}
              </button>
              
              <button 
                type="submit" 
                className="sk-cmn-sklcss-button sk-cmn-sklcss-button-primary sk-cmn-sklcss-button-full"
                disabled={isLoading || otp.some(digit => digit === '')}
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </button>
            </form>
            
            <p className="sk-cmn-sklcss-text-center sk-cmn-sklcss-mt-3">
              Didn't receive code? Check your spam folder.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sk2FAVerify;