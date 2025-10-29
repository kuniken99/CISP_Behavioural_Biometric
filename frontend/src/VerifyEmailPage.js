import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './styles/LoginPage.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

function VerifyEmailPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setVerificationStatus('error');
        setMessage('Invalid verification link. No token provided.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/Auth/verify-email/${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (response.ok) {
          setVerificationStatus('success');
          setMessage(data.message || 'Email verified successfully. Setting up your profile...');
          
          // Store JWT token if provided for auto-training
          if (data.token) {
            localStorage.setItem('jwt_token', data.token);
          }
          
          // If user needs 2FA setup, store their email for the setup process
          if (data.requiresTwoFactorSetup && data.email) {
            localStorage.setItem('pendingTwoFactorSetup', JSON.stringify({
              email: data.email,
              username: data.username,
              token: data.token
            }));
          }

          // Redirect to training progress after 2 seconds
          setTimeout(() => {
            // Auto-login and redirect to training
            if (data.token) {
              navigate('/training-progress');
            } else {
              navigate('/login');
            }
          }, 2000);
        } else {
          setVerificationStatus('error');
          setMessage(data.message || 'Email verification failed. The link may be invalid or expired.');
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setVerificationStatus('error');
        setMessage('An error occurred during email verification. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [token, navigate]);

  const handleLoginRedirect = () => {
    // Check if user needs to set up 2FA
    const pendingSetup = localStorage.getItem('pendingTwoFactorSetup');
    if (pendingSetup) {
      // Redirect to 2FA setup with stored user info
      navigate('/login', { 
        state: { 
          redirectTo2FA: true, 
          userData: JSON.parse(pendingSetup) 
        }
      });
      // Clear the stored data
      localStorage.removeItem('pendingTwoFactorSetup');
    } else {
      navigate('/login');
    }
  };

  const handleResendVerification = () => {
    navigate('/resend-verification');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Email Verification</h2>
        </div>

        {isLoading && (
          <div className="verification-content">
            <div className="verification-loading">
              <div className="loading-spinner"></div>
              <p>Verifying your email address...</p>
            </div>
          </div>
        )}

        {!isLoading && verificationStatus === 'success' && (
          <div className="verification-content">
            <div className="verification-success">
              <div className="success-icon">✓</div>
              <h3>Email Verified Successfully!</h3>
              <p className="verification-message">{message}</p>
              <div className="verification-actions">
                <button 
                  type="button"
                  className="button primary"
                  onClick={handleLoginRedirect}
                  style={{ 
                    backgroundColor: '#000000', 
                    color: '#ffffff',
                    border: '1px solid #000000'
                  }}
                >
                  Continue to Setup
                </button>
              </div>
            </div>
          </div>
        )}

        {!isLoading && verificationStatus === 'error' && (
          <div className="verification-content">
            <div className="verification-error">
              <div className="error-icon">✗</div>
              <h3>Verification Failed</h3>
              <p className="verification-message">{message}</p>
              <div className="verification-actions">
                <button 
                  type="button"
                  className="button secondary"
                  onClick={handleResendVerification}
                  style={{ marginRight: '10px' }}
                >
                  Resend Verification Email
                </button>
                <button 
                  type="button"
                  className="button primary"
                  onClick={handleLoginRedirect}
                >
                  Back to Login
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="auth-footer">
          <p>
            Need help? <Link to="/contact">Contact Support</Link>
          </p>
          <p className="copyright">
            © 2025 CBBA Security System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmailPage;