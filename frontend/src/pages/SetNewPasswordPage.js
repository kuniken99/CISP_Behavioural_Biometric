import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { API_BASE_URL } from '../utils/config';
import eyeIcon from '../assets/eye-icon.svg';
import '../styles/LoginPage.css';

const SetNewPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const recaptchaRef = useRef(null);

  useEffect(() => {
    // Verify token on component mount
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    if (!token) {
      setError('Invalid reset link.');
      setTokenValid(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/Auth/verify-reset-token/${token}`, {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.isValid) {
          setTokenValid(true);
          setUserEmail(data.email);
        } else {
          setError('Invalid or expired reset token.');
          setTokenValid(false);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Invalid or expired reset token.');
        setTokenValid(false);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setTokenValid(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!recaptchaVerified) {
      setError('Please verify the reCAPTCHA');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/Auth/confirm-reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: token,
          newPassword: newPassword,
          confirmPassword: confirmPassword,
          recaptchaToken: recaptchaToken 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message);
        setNewPassword('');
        setConfirmPassword('');
        resetRecaptcha();
        
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          setError(errorData.message || 'Failed to reset password');
        } catch {
          setError(errorText || 'Failed to reset password');
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

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (tokenValid === null) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="auth-title">Verifying reset token...</h2>
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <button 
            type="button"
            className="back-to-login-btn"
            onClick={handleBackToLogin}
          >
            ← Back to Login
          </button>

          <h2 className="auth-title">Invalid Reset Link</h2>
          
          <div className="error">{error}</div>
          
          <p style={{ textAlign: 'center', marginTop: '20px' }}>
            This reset link is invalid or has expired. Please request a new password reset.
          </p>
          
          <button 
            type="button" 
            className="btn btn-primary btn-full"
            onClick={handleBackToLogin}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Back to Login Button */}
        <button 
          type="button"
          className="back-to-login-btn"
          onClick={handleBackToLogin}
        >
          ← Back to Login
        </button>

        <h2 className="auth-title">Set New Password</h2>
        
        {userEmail && (
          <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
            Setting new password for: <strong>{userEmail}</strong>
          </p>
        )}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>New Password*</label>
            <div className="password-input-container">
              <input 
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter new password (min. 8 characters)"
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                required 
                minLength={8}
                disabled={isSubmitting}
              />
              <button 
                type="button"
                className="password-toggle"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              >
                <img src={eyeIcon} alt="Toggle password visibility" className="eye-icon" />
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Confirm New Password*</label>
            <div className="password-input-container">
              <input 
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
                minLength={8}
                disabled={isSubmitting}
              />
              <button 
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                <img src={eyeIcon} alt="Toggle password visibility" className="eye-icon" />
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
          {success && (
            <div className="success">
              {success}
              <br />
              <small>Redirecting to login in 3 seconds...</small>
            </div>
          )}
          
          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={!recaptchaVerified || isSubmitting || !newPassword || !confirmPassword}
          >
            {isSubmitting ? 'Setting Password...' : 'Set New Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetNewPasswordPage;