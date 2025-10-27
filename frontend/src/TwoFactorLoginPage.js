import React, { useState, useEffect, useRef } from 'react';
import './styles/LoginPage.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

function TwoFactorLoginPage({ setCurrentAuthPage, email, onLogin }) {
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const codeInputRef = useRef(null);

  // Auto-focus the input field when component mounts
  useEffect(() => {
    if (codeInputRef.current) {
      codeInputRef.current.focus();
    }
  }, []);

  const submitCode = async (code) => {
    if (!code.trim() || code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/twofactor/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          code: code.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store JWT token in localStorage
        if (data.token) {
          localStorage.setItem('jwt_token', data.token);
        }
        
        // Complete the login process
        onLogin(data.token, data.user.username, data.user.role);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Invalid verification code');
        setVerificationCode(''); // Clear the code input
        
        // Auto-focus the input after failed verification
        setTimeout(() => {
          if (codeInputRef.current) {
            codeInputRef.current.focus();
          }
        }, 100);
      }
    } catch (err) {
      setError('Network error during verification');
      console.error('2FA login error:', err);
      setVerificationCode(''); // Clear the code input
      
      // Auto-focus the input after network error
      setTimeout(() => {
        if (codeInputRef.current) {
          codeInputRef.current.focus();
        }
      }, 100);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submitCode(verificationCode);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Two-Factor Authentication</h2>
        <p className="auth-subtitle">
          Enter the 6-digit code from your authenticator app
        </p>

        <div className="email-display">
          {email}
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="verificationCode">Authentication Code</label>
            <input
              ref={codeInputRef}
              type="text"
              id="verificationCode"
              value={verificationCode}
              onChange={(e) => {
                const newCode = e.target.value.replace(/\D/g, '').substring(0, 6);
                setVerificationCode(newCode);
                setError(''); // Clear any existing error when user types
                
                // Auto-submit when 6 digits are entered
                if (newCode.length === 6 && !isLoading) {
                  submitCode(newCode);
                }
              }}
              placeholder="000000"
              maxLength="6"
              className="twofa-code-input"
              disabled={isLoading}
              autoComplete="one-time-code"
              required
              autoFocus
              style={{
                fontSize: '24px',
                textAlign: 'center',
                letterSpacing: '8px',
                fontFamily: 'monospace',
                padding: '16px',
                border: error ? '2px solid #f44336' : (verificationCode.length === 6 ? '2px solid #4CAF50' : '2px solid #ddd'),
                borderRadius: '8px',
                transition: 'border-color 0.3s ease',
                backgroundColor: error ? '#ffebee' : 'white'
              }}
            />
          </div>

          {error && (
            <div className="message error" style={{
              backgroundColor: '#ffebee',
              border: '1px solid #f44336',
              borderRadius: '4px',
              padding: '12px',
              marginBottom: '16px',
              color: '#c62828',
              fontWeight: '500',
              textAlign: 'center'
            }}>
              ⚠️ {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={isLoading || verificationCode.length !== 6}
          >
            {isLoading ? (
              <>
                <span>🔐 Verifying...</span>
              </>
            ) : verificationCode.length === 6 ? (
              <>
                <span>✓ Verify Code</span>
              </>
            ) : (
              <>
                <span>Enter 6-digit code</span>
              </>
            )}
          </button>
        </form>

        <div className="twofa-help">
          <p className="help-text">
            Can't access your authenticator app?
          </p>
          <button 
            type="button"
            className="link-button"
            onClick={() => {
              // You can implement backup codes or other recovery methods here
              alert('Please contact support for assistance with account recovery.');
            }}
          >
            Get Help
          </button>
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

export default TwoFactorLoginPage;