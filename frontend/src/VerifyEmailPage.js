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
        const response = await fetch(`${API_BASE_URL}/api/auth/verify-email/${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (response.ok) {
          setVerificationStatus('success');
          setMessage(data.message || 'Email verified successfully. You can now log in.');
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
  }, [token]);

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  const handleResendVerification = () => {
    navigate('/resend-verification');
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-form">
          <div className="login-header">
            <h2>Email Verification</h2>
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
                <p>{message}</p>
                <div className="verification-actions">
                  <button 
                    type="button"
                    className="btn-primary"
                    onClick={handleLoginRedirect}
                  >
                    Go to Login
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
                <p>{message}</p>
                <div className="verification-actions">
                  <button 
                    type="button"
                    className="btn-secondary"
                    onClick={handleResendVerification}
                  >
                    Resend Verification Email
                  </button>
                  <button 
                    type="button"
                    className="btn-primary"
                    onClick={handleLoginRedirect}
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="login-footer">
            <p>
              Need help? <Link to="/contact">Contact Support</Link>
            </p>
            <p className="copyright">
              © 2025 CBBA Security System. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmailPage;