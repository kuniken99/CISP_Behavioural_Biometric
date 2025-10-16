import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { API_BASE_URL } from '../utils/config';
import eyeIcon from '../assets/eye-icon.svg';
import '../styles/LoginPage.css';

const LoginPage = ({ onLogin, setCurrentAuthPage }) => {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const recaptchaRef = useRef(null);

  // Handle redirect from email verification to 2FA setup
  useEffect(() => {
    if (location.state?.redirectTo2FA && location.state?.userData) {
      const userData = location.state.userData;
      // Automatically redirect to 2FA setup
      setCurrentAuthPage('twofa-setup', { 
        email: userData.email, 
        username: userData.username
      });
    }
  }, [location.state, setCurrentAuthPage]);

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
        body: JSON.stringify({ 
          username: email, 
          password: password,
          recaptchaToken: recaptchaToken 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onLogin(data.token, data.username, data.role);
      } else {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          
          // Check if account is locked
          if (errorData.isLocked) {
            const lockoutMessage = errorData.message || 
              `Account is locked due to multiple failed login attempts. Please try again in ${errorData.remainingMinutes || 'a few'} minutes.`;
            setError(lockoutMessage);
            resetRecaptcha();
            return;
          }

          // Check if user needs email verification
          if (errorData.emailNotVerified) {
            // Redirect to email verification page with user's email and login context
            setCurrentAuthPage('verify-email', { 
              email: errorData.email, 
              username: errorData.username,
              context: 'login'
            });
            return;
          }

          // Check if user needs 2FA setup
          if (errorData.twoFactorRequired) {
            // Redirect to 2FA setup page
            setCurrentAuthPage('twofa-setup', { 
              email: errorData.email, 
              username: errorData.username
            });
            return;
          }

          // Check if user needs to enter 2FA code
          if (errorData.requiresTwoFactorCode) {
            // Redirect to 2FA login page
            setCurrentAuthPage('twofa-login', { 
              email: errorData.email, 
              username: errorData.username
            });
            return;
          }
          
          // Show remaining attempts if available
          let errorMessage = errorData.message || 'Login failed';
          if (errorData.remainingAttempts !== undefined && errorData.remainingAttempts > 0) {
            errorMessage = errorData.message;
          }
          setError(errorMessage);
        } catch {
          setError(errorText || 'Login failed');
        }
        // Reset reCAPTCHA after failed login attempt
        resetRecaptcha();
      }
    } catch (err) {
      setError('Network error during login.');
      console.error(err);
      // Reset reCAPTCHA after network error
      resetRecaptcha();
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

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Login to CBBA Admin</h2>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email or Username</label>
            <input 
              type="text" 
              placeholder="Enter your email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              autoComplete="email"
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: '10px' }}>
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
                <img src={eyeIcon} alt="Toggle password visibility" className="eye-icon" />
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

          {/* Google reCAPTCHA v2 */}
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