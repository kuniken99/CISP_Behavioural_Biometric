import React, { useState, useEffect, useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { useNavigate } from 'react-router-dom';
import './styles/LoginPage.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

function TwoFactorSetupPage({ setCurrentAuthPage, email, onSetupComplete }) {
  const [qrCodeImage, setQrCodeImage] = useState('');
  const [manualEntryCode, setManualEntryCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [setupComplete, setSetupComplete] = useState(false);
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const recaptchaRef = useRef(null);
  const codeInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize 2FA setup when component mounts
    initializeTwoFactor();
  }, [email]);

  // Auto-focus the verification code input when QR code is loaded
  useEffect(() => {
    if (qrCodeImage && codeInputRef.current) {
      // Add a small delay to ensure the QR code section is rendered
      setTimeout(() => {
        if (codeInputRef.current) {
          codeInputRef.current.focus();
        }
      }, 100);
    }
  }, [qrCodeImage]);

  const initializeTwoFactor = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/twofactor/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        const data = await response.json();
        setQrCodeImage(data.qrCodeImage);
        setManualEntryCode(data.manualEntryCode);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to initialize 2FA setup');
      }
    } catch (err) {
      setError('Network error during 2FA setup initialization');
      console.error('2FA setup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Google reCAPTCHA verification
  const handleRecaptchaVerify = (token) => {
    setRecaptchaVerified(!!token);
    setRecaptchaToken(token || '');
  };

  const handleRecaptchaExpired = () => {
    setRecaptchaVerified(false);
    setRecaptchaToken('');
  };

  // Reset reCAPTCHA widget
  const resetRecaptcha = () => {
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
      setRecaptchaVerified(false);
      setRecaptchaToken('');
    }
  };

  const submitVerifyCode = async (code) => {
    if (!code.trim()) {
      setError('Please enter the 6-digit code');
      return;
    }

    if (!recaptchaVerified) {
      setError('Please verify the reCAPTCHA');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/twofactor/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          code: code.trim(),
          recaptchaToken: recaptchaToken
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store the JWT token if provided
        if (data.token) {
          localStorage.setItem('jwt_token', data.token);
        }
        
        setSetupComplete(true);
        // Call the completion callback after a short delay to show success message
        setTimeout(() => {
          if (onSetupComplete) {
            onSetupComplete(data.token, data.user);
          }
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Invalid verification code');
        setVerificationCode(''); // Clear the code input
        resetRecaptcha(); // Reset reCAPTCHA on error
      }
    } catch (err) {
      setError('Network error during verification');
      console.error('2FA verification error:', err);
      resetRecaptcha(); // Reset reCAPTCHA on network error
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    await submitVerifyCode(verificationCode);
  };

  if (isLoading && !qrCodeImage) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="verification-loading">
            <div className="loading-spinner"></div>
            <p>Setting up Two-Factor Authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  if (setupComplete) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="verification-success" style={{ textAlign: 'center' }}>
            <div className="success-icon" style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 20px auto'
            }}>✓</div>
            <h2 className="auth-title">Setup Complete!</h2>
            <p>Two-factor authentication has been successfully configured for your account.</p>
            <p>You will now be redirected to the dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card twofa-setup-card">
        <h2 className="auth-title">Two-Factor Authentication Setup</h2>
        
        <div className="twofa-step">
          <p className="step-text">
            <strong>Step 1:</strong> Please use your Google Authenticator on your mobile device to scan this QR Code
          </p>
          
          {qrCodeImage && (
            <div className="qr-code-container">
              <img 
                src={`data:image/png;base64,${qrCodeImage}`} 
                alt="2FA QR Code" 
                className="qr-code-image"
              />
            </div>
          )}
          
          <p className="alternative-text">
            Alternatively, enter this code into your Google Authenticator app
          </p>
          
          {manualEntryCode && (
            <div className="manual-code-container">
              <div className="manual-code">
                {manualEntryCode}
              </div>
            </div>
          )}
        </div>

        <div className="twofa-step">
          <p className="step-text">
            <strong>Step 2:</strong> Enter the code given by the app on your mobile device.
          </p>
          
          <form onSubmit={handleVerifyCode} className="auth-form">
            <div className="form-group">
              <label htmlFor="verificationCode">6-digit code</label>
              <input
                ref={codeInputRef}
                type="text"
                id="verificationCode"
                value={verificationCode}
                onChange={(e) => {
                  const newCode = e.target.value.replace(/\D/g, '').substring(0, 6);
                  setVerificationCode(newCode);
                  
                  // Auto-submit when 6 digits are entered and reCAPTCHA is verified
                  if (newCode.length === 6 && !isLoading && recaptchaVerified) {
                    submitVerifyCode(newCode);
                  }
                }}
                placeholder="e.g. 123456"
                maxLength="6"
                className="twofa-code-input"
                disabled={isLoading}
                autoComplete="one-time-code"
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="message error">
                {error}
              </div>
            )}

            <div className="recaptcha-container">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
                onChange={handleRecaptchaVerify}
                onExpired={handleRecaptchaExpired}
                size="normal"
                theme="light"
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary btn-full"
              disabled={isLoading || verificationCode.length !== 6 || !recaptchaVerified}
            >
              {isLoading ? 'Verifying...' : 'Continue'}
            </button>
          </form>
        </div>

        <div className="back-to-login">
          <button 
            type="button"
            className="link-button"
            onClick={() => setCurrentAuthPage('login')}
            disabled={isLoading}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default TwoFactorSetupPage;