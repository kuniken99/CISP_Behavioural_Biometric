import React, { useState } from 'react';
import { API_BASE_URL } from '../utils/config';

const LoginPage = ({ onLogin, setCurrentAuthPage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!recaptchaVerified) {
      setError('Please verify the reCAPTCHA');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/Auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        onLogin(data.token, data.username, data.role);
      } else {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          setError(errorData.message || 'Login failed');
        } catch {
          setError(errorText || 'Login failed');
        }
      }
    } catch (err) {
      setError('Network error during login.');
      console.error(err);
    }
  };

  // Mock reCAPTCHA verification
  const handleRecaptchaVerify = () => {
    setRecaptchaVerified(true);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Login to CBBA Admin</h2>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              placeholder="Enter your email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              autoComplete="email"
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <div className="password-input-container">
              <input 
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                autoComplete="current-password"
              />
              <button 
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️‍🗨️' : '👁️'}
              </button>
            </div>
          </div>

          <div className="form-links">
            <button 
              type="button" 
              className="link-button"
              onClick={() => setCurrentAuthPage('forgot-password')}
            >
              Forgot password?
            </button>
            <div className="signup-link">
              <span>No account? </span>
              <button 
                type="button" 
                className="link-button"
                onClick={() => setCurrentAuthPage('register')}
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Mock reCAPTCHA */}
          <div className="recaptcha-container">
            <div className="recaptcha-placeholder">
              <span>reCAPTCHA placeholder</span>
            </div>
            <button 
              type="button"
              className="recaptcha-verify-btn"
              onClick={handleRecaptchaVerify}
              disabled={recaptchaVerified}
            >
              {recaptchaVerified ? '✓ Verified' : 'Verify'}
            </button>
          </div>

          {error && <div className="error">{error}</div>}
          
          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={!recaptchaVerified}
          >
            Login
          </button>

          <div className="terms-text">
            By continuing, you agree to the{' '}
            <button 
              type="button" 
              className="link-button"
              onClick={() => setCurrentAuthPage('terms')}
            >
              Terms of Use
            </button>
            {' '}and{' '}
            <button 
              type="button" 
              className="link-button"
              onClick={() => setCurrentAuthPage('privacy')}
            >
              Privacy Policy
            </button>
            .
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;