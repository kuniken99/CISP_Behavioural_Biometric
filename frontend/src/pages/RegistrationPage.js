import React, { useState, useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { API_BASE_URL } from '../utils/config';
import eyeIcon from '../assets/eye-icon.svg';
import arrowBackIcon from '../assets/arrow-back-icon.svg';
import dropdownIcon from '../assets/dropdown-icon.svg';
import '../styles/LoginPage.css';

const RegistrationPage = ({ setCurrentAuthPage }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'User',
    uniqueCode: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const recaptchaRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Validation
    if (!formData.username || !formData.email || !formData.uniqueCode || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      setIsSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsSubmitting(false);
      return;
    }

    if (!recaptchaVerified) {
      setError('Please verify the reCAPTCHA');
      setIsSubmitting(false);
      return;
    }

    if (!agreedToTerms) {
      setError('Please agree to the Terms of Use and Privacy Policy');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/Auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          role: formData.role,
          uniqueCode: formData.uniqueCode,
          password: formData.password,
          recaptchaToken: recaptchaToken
        }),
      });

      if (response.ok) {
        // Navigate to email verification page with registration context
        setCurrentAuthPage('verify-email', { 
          email: formData.email,
          context: 'registration'
        });
      } else {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          setError(errorData.message || 'Registration failed');
        } catch {
          setError(errorText || 'Registration failed');
        }
        resetRecaptcha();
      }
    } catch (err) {
      setError('Network error during registration. Please try again.');
      resetRecaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecaptchaVerify = (token) => {
    setRecaptchaVerified(true);
    setRecaptchaToken(token);
  };

  const handleRecaptchaExpired = () => {
    setRecaptchaVerified(false);
    setRecaptchaToken('');
  };

  const resetRecaptcha = () => {
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
    setRecaptchaVerified(false);
    setRecaptchaToken('');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Back to Login Button */}
        <button 
          type="button"
          className="back-buttonn"
          onClick={() => setCurrentAuthPage('login')}
        >
          <img src={arrowBackIcon} alt="Back" className="back-icon" />
          Back to Login
        </button>

        <h2 className="auth-title">Create an Account</h2>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Username*</label>
            <input 
              type="text" 
              name="username"
              placeholder="Choose a username"
              value={formData.username} 
              onChange={handleInputChange} 
              required 
              autoComplete="username"
              disabled={isSubmitting}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Email*</label>
            <input 
              type="email" 
              name="email"
              placeholder="Enter your email"
              value={formData.email} 
              onChange={handleInputChange} 
              required 
              autoComplete="email"
              disabled={isSubmitting}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Role*</label>
            <div className="select-wrapper">
              <select 
                name="role"
                value={formData.role} 
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="form-select"
              >
                <option value="User">User</option>
                <option value="DBA">DBA</option>
                <option value="Admin">Admin</option>
              </select>
              <img src={dropdownIcon} alt="Dropdown" className="dropdown-icon" />
            </div>
          </div>

          <div className="form-group">
            <label>Unique Code*</label>
            <input 
              type="text" 
              name="uniqueCode"
              placeholder="Enter your unique code"
              value={formData.uniqueCode} 
              onChange={handleInputChange} 
              required 
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label>Password*</label>
            <div className="password-input-container">
              <input 
                type={showPassword ? "text" : "password"} 
                name="password"
                placeholder="Create a password"
                value={formData.password} 
                onChange={handleInputChange} 
                required 
                autoComplete="new-password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
              >
                <img src={eyeIcon} alt="Toggle password visibility" />
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Confirm Password*</label>
            <div className="password-input-container">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword} 
                onChange={handleInputChange} 
                required 
                autoComplete="new-password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isSubmitting}
              >
                <img src={eyeIcon} alt="Toggle password visibility" />
              </button>
            </div>
          </div>

          <div className="register-checkbox">
            <input 
              type="checkbox" 
              required 
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
            />
            <span>
                By creating an account, I agree to the{" "}
                <a href="#" onClick={() => setCurrentAuthPage('terms')} className="link-button">Terms of Use</a> and{" "}
                <a href="#" onClick={() => setCurrentAuthPage('privacy')} className="link-button">Privacy Policy</a>.
            </span>
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
            disabled={!recaptchaVerified || !agreedToTerms || isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Create an Account'}
          </button>

          <div className="signup">
            <span>Have an account? </span>
            <button 
              type="button" 
              className="link-button"
              onClick={() => setCurrentAuthPage('login')}
            >
              Log In
            </button>
            <span> instead</span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrationPage;