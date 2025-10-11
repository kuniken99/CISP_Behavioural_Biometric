import React, { useState } from 'react';
import './styles/LoginPage.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

function TwoFactorLoginPage({ setCurrentAuthPage, email, onLogin }) {
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/twofactor/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          code: verificationCode.trim()
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
      }
    } catch (err) {
      setError('Network error during verification');
      console.error('2FA login error:', err);
    } finally {
      setIsLoading(false);
    }
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
              type="text"
              id="verificationCode"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
              placeholder="000000"
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

          <button 
            type="submit" 
            className="btn-primary btn-full"
            disabled={isLoading || verificationCode.length !== 6}
          >
            {isLoading ? 'Verifying...' : 'Verify'}
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