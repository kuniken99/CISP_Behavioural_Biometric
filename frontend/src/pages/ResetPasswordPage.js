import React, { useState, useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { API_BASE_URL } from '../utils/config';
import '../styles/LoginPage.css';

const ResetPasswordPage = ({ setCurrentAuthPage }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const recaptchaRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!recaptchaVerified) {
      setError('Please verify the reCAPTCHA');
      return;
    }

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/Auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email,
          recaptchaToken: recaptchaToken 
        }),
      });

      if (response.ok) {
        setSuccess('Password reset link has been sent to your email address.');
        setEmail('');
        resetRecaptcha();
      } else {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          setError(errorData.message || 'Failed to send reset link');
        } catch {
          setError(errorText || 'Failed to send reset link');
        }
        resetRecaptcha();
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
      resetRecaptcha();
    } finally {
      setIsSubmitting(false);
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
        {/* Back to Login Button */}
        <button 
          type="button"
          className="back-to-login-btn"
          onClick={() => setCurrentAuthPage('login')}
        >
          ← Back to Login
        </button>

        <h2 className="auth-title">Reset Password</h2>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email*</label>
            <input 
              type="email" 
              placeholder="Enter your email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              autoComplete="email"
              disabled={isSubmitting}
            />
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
          {success && <div className="success">{success}</div>}
          
          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={!recaptchaVerified || isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>

          <div className="signup-link">
            <span>Don't have an account? </span>
            <button 
              type="button" 
              className="link-button"
              onClick={() => setCurrentAuthPage('register')}
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;