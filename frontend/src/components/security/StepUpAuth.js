// frontend/src/components/security/StepUpAuth.js
import React, { useState, useEffect, useRef } from 'react';
import '../../styles/StepUpAuth.css';
import warningIcon from '../../assets/step-up-icon.svg';
import shieldIcon from '../../assets/shield-icon.svg';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

/**
 * StepUpAuth - Moderate Risk (50-79%) Authentication Modal
 * Simple Google Authenticator verification modal
 */
const StepUpAuth = ({ show, riskScore, onVerify, onCancel, username }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const codeInputRef = useRef(null);

  // Auto-focus the input field when modal shows
  useEffect(() => {
    if (show && codeInputRef.current) {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        codeInputRef.current?.focus();
      }, 100);
    }
    
    // Reset state when modal closes
    if (!show) {
      setVerificationCode('');
      setError('');
      setAttempts(0);
      setIsLoading(false);
    }
  }, [show]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [show]);

  const submitCode = async (code) => {
    if (!code.trim() || code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('jwt_token');
      const cleanCode = code.trim().replace(/\s/g, '');
      
      console.log('[CBBA] Submitting verification code:', {
        codeLength: cleanCode.length,
        riskScore: riskScore,
        endpoint: `${API_BASE_URL}/twofactor/verify-moderate-risk`
      });
      
      const response = await fetch(`${API_BASE_URL}/twofactor/verify-moderate-risk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: cleanCode,
          riskScore: riskScore || 0
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        console.log('[CBBA] Moderate risk verification successful:', data);
        
        // Call onVerify callback with success
        onVerify(true, data);
        
        // Reset modal state
        setVerificationCode('');
        setError('');
        setAttempts(0);
      } else {
        console.log('[CBBA] Verification failed with status:', response.status);
        let errorMessage = 'Invalid verification code';
        try {
          const errorData = await response.json();
          console.log('[CBBA] Error response:', errorData);
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          console.error('[CBBA] Failed to parse error response:', jsonError);
          // If response is not JSON, use default message
          errorMessage = `Verification failed (${response.status})`;
        }
        
        setError(errorMessage);
        setVerificationCode(''); // Clear the code input
        setAttempts(prev => prev + 1);
        
        // Auto-focus the input after failed verification
        setTimeout(() => {
          codeInputRef.current?.focus();
        }, 100);
        
        // Too many failed attempts - force logout
        if (attempts >= 2) { // 3 total attempts
          setError('Too many failed attempts. For your security, you will be logged out.');
          setTimeout(() => {
            onCancel(); // This should trigger logout in parent component
          }, 2000);
        }
      }
    } catch (err) {
      console.error('Moderate risk verification error:', err);
      setError('Network error. Please check your connection and try again.');
      setVerificationCode(''); // Clear the code input
      setAttempts(prev => prev + 1);
      
      // Auto-focus the input after network error
      setTimeout(() => {
        codeInputRef.current?.focus();
      }, 100);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submitCode(verificationCode);
  };

  const handleBackdropClick = (e) => {
    // Prevent closing modal by clicking backdrop - user must verify
    // Only allow if explicitly cancelled (future feature)
    e.stopPropagation();
  };

  if (!show) return null;

  const handleClear = () => {
    setVerificationCode('');
    setError('');
    codeInputRef.current?.focus();
  };

  return (
    <div className="stepup-overlay" onClick={handleBackdropClick}>
      <div className="stepup-backdrop"></div>
      
      <div className="stepup-modal" onClick={(e) => e.stopPropagation()}>
        {/* Warning Icon */}
        <div className="stepup-icon-container">
          <img src={warningIcon} alt="Warning" className="stepup-warning-icon" />
        </div>

        {/* Title */}
        <h2 className="stepup-title">Additional Verification Required</h2>
        
        {/* Subtitle */}
        <p className="stepup-subtitle">
          We detected unusual activity. Please verify your identity to continue.
        </p>

        {/* Google Authenticator */}
        <div className="stepup-auth-method">
          <img src={shieldIcon} alt="Shield" className="stepup-shield-icon" />
          <span className="stepup-method-text">Google Authenticator</span>
        </div>
        
        <p className="stepup-instruction">
          Open your authenticator app and enter the 6-digit code
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="stepup-form">
          <label className="stepup-label">Verification Code</label>
          <input
            ref={codeInputRef}
            type="text"
            value={verificationCode}
            onChange={(e) => {
              const newCode = e.target.value.replace(/\D/g, '').substring(0, 6);
              setVerificationCode(newCode);
              setError('');
            }}
            placeholder="Enter 6-digit code"
            maxLength="6"
            className="stepup-input"
            disabled={isLoading}
            autoComplete="one-time-code"
            autoFocus
            inputMode="numeric"
            pattern="[0-9]*"
          />

          {/* Error message */}
          {error && (
            <div className="stepup-error">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="stepup-buttons">
            <button 
              type="button"
              onClick={handleClear}
              className="stepup-btn-clear"
              disabled={isLoading}
            >
              Clear
            </button>
            <button 
              type="submit"
              className="stepup-btn-verify"
              disabled={isLoading || verificationCode.length !== 6}
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>

        {/* Contact Support */}
        <div className="stepup-support">
          Please contact support at <strong>tank108@uni.coventry.ac.uk</strong>
        </div>
      </div>
    </div>
  );
};

export default StepUpAuth;
