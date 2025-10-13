import React, { useState, useRef, useEffect } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { API_BASE_URL } from '../utils/config';
import eyeIcon from '../assets/eye-icon.svg';
import arrowBackIcon from '../assets/arrow-back-icon.svg';
import dropdownIcon from '../assets/dropdown-icon.svg';
import '../styles/LoginPage.css';

const RegistrationPage = ({ 
  setCurrentAuthPage, 
  initialFormData = null, 
  onFormDataChange = null, 
  initialAgreedToTerms = false, 
  onAgreedToTermsChange = null 
}) => {
  const [formData, setFormData] = useState(initialFormData || {
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
  const [agreedToTerms, setAgreedToTerms] = useState(initialAgreedToTerms || false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: '',
    color: '#dc2626',
    requirements: {
      minLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumbers: false,
      hasSpecialChars: false
    }
  });
  const recaptchaRef = useRef(null);

  const checkPasswordStrength = (password) => {
    const requirements = {
      minLength: password.length >= 12,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /[0-9]/.test(password),
      hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const metRequirements = Object.values(requirements).filter(Boolean).length;
    let score = 0;
    let label = '';
    let color = '#dc2626';

    if (password.length === 0) {
      score = 0;
      label = '';
      color = '#dc2626';
    } else if (metRequirements <= 2) {
      score = 1;
      label = 'Weak';
      color = '#dc2626';
    } else if (metRequirements <= 3) {
      score = 2;
      label = 'Medium';
      color = '#f59e0b';
    } else if (metRequirements >= 4) {
      score = 3;
      label = 'Strong';
      color = '#10b981';
    }

    return { score, label, color, requirements };
  };

  // Recalculate password strength when component mounts with existing form data
  useEffect(() => {
    if (formData.password) {
      const strength = checkPasswordStrength(formData.password);
      setPasswordStrength(strength);
    }
  }, []); // Only run on mount

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: value
    };
    
    setFormData(updatedFormData);
    
    // Update parent component's form data if callback is provided
    if (onFormDataChange) {
      onFormDataChange(updatedFormData);
    }

    // Check password strength when password field changes
    if (name === 'password') {
      const strength = checkPasswordStrength(value);
      setPasswordStrength(strength);
    }
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

    // Enhanced password validation using strength requirements
    const strength = checkPasswordStrength(formData.password);
    if (!strength.requirements.minLength) {
      setError('Password must be at least 12 characters long');
      setIsSubmitting(false);
      return;
    }

    const unmetRequirements = [];
    if (!strength.requirements.hasUppercase) unmetRequirements.push('uppercase letters');
    if (!strength.requirements.hasLowercase) unmetRequirements.push('lowercase letters');
    if (!strength.requirements.hasNumbers) unmetRequirements.push('numbers');
    if (!strength.requirements.hasSpecialChars) unmetRequirements.push('special characters');

    if (unmetRequirements.length > 1) {
      setError(`Password must include at least 3 of the following: uppercase letters, lowercase letters, numbers, and special characters`);
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
          <div className="form-group" style={{ marginBottom: '10px' }}>
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

          <div className="form-group" style={{ marginBottom: '10px' }}>
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

          <div className="form-group" style={{ marginBottom: '10px' }}>
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

          <div className="form-group" style={{ marginBottom: '10px' }}>
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

          <div className="form-group" style={{ marginBottom: '10px' }}>
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
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="password-strength-container">
                <div className="password-strength-header">
                  <span className="password-strength-label">Password Strength</span>
                  <span 
                    className="password-strength-score"
                    style={{ color: passwordStrength.color, fontWeight: '600' }}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
                
                <div className="password-strength-bar">
                  <div 
                    className="password-strength-progress"
                    style={{ 
                      width: `${(passwordStrength.score / 3) * 100}%`,
                      backgroundColor: passwordStrength.color 
                    }}
                  ></div>
                </div>
                
                <div className="password-requirements">
                  <div className="requirements-title">Password Requirements:</div>
                  <div className="requirements-list">
                    <div className={`requirement ${passwordStrength.requirements.minLength ? 'met' : 'unmet'}`}>
                      <span className="requirement-icon">
                        {passwordStrength.requirements.minLength ? '✓' : '✗'}
                      </span>
                      <span>Minimum 12 characters long</span>
                    </div>
                    <div className={`requirement ${passwordStrength.requirements.hasUppercase ? 'met' : 'unmet'}`}>
                      <span className="requirement-icon">
                        {passwordStrength.requirements.hasUppercase ? '✓' : '✗'}
                      </span>
                      <span>Uppercase letters (A-Z)</span>
                    </div>
                    <div className={`requirement ${passwordStrength.requirements.hasLowercase ? 'met' : 'unmet'}`}>
                      <span className="requirement-icon">
                        {passwordStrength.requirements.hasLowercase ? '✓' : '✗'}
                      </span>
                      <span>Lowercase letters (a-z)</span>
                    </div>
                    <div className={`requirement ${passwordStrength.requirements.hasNumbers ? 'met' : 'unmet'}`}>
                      <span className="requirement-icon">
                        {passwordStrength.requirements.hasNumbers ? '✓' : '✗'}
                      </span>
                      <span>Numbers (0-9)</span>
                    </div>
                    <div className={`requirement ${passwordStrength.requirements.hasSpecialChars ? 'met' : 'unmet'}`}>
                      <span className="requirement-icon">
                        {passwordStrength.requirements.hasSpecialChars ? '✓' : '✗'}
                      </span>
                      <span>Special characters (!@#$%^&*)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '0px' }}>
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
              onChange={(e) => {
                setAgreedToTerms(e.target.checked);
                if (onAgreedToTermsChange) {
                  onAgreedToTermsChange(e.target.checked);
                }
              }}
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