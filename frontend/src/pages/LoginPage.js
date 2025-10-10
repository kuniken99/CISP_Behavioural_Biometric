import React, { useState, useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { API_BASE_URL } from '../utils/config';
import eyeIcon from '../assets/eye-icon.svg';
import '../styles/LoginPage.css';

const LoginPage = ({ onLogin, setCurrentAuthPage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const recaptchaRef = useRef(null);

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
          setError(errorData.message || 'Login failed');
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
            <label>Email</label>
            <input 
              type="text" 
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