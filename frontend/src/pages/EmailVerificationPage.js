import React, { useState } from 'react';
import { API_BASE_URL } from '../utils/config';
import '../styles/LoginPage.css';

const EmailVerificationPage = ({ setCurrentAuthPage, email, context = 'registration' }) => {
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleResendEmail = async () => {
    setIsResending(true);
    setResendMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/Auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email }),
      });

      if (response.ok) {
        setResendMessage('Verification email sent successfully!');
      } else {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          setResendMessage(`Error: ${errorData.message || 'Failed to resend email'}`);
        } catch {
          setResendMessage(`Error: ${errorText || 'Failed to resend email'}`);
        }
      }
    } catch (err) {
      setResendMessage('Network error. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card verification-card">
        {/* Email Icon with Checkmark */}
        <div className="verification-icon">
          <div className="email-icon">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="22,6 12,13 2,6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className="check-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#10B981"/>
                <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <h2 className="auth-title">
          {context === 'login' ? 'Email Verification Required' : 'Verify Your Email'}
        </h2>
        
        <p className="verification-text">
          {context === 'login' 
            ? 'Please verify your email address to complete login' 
            : 'We\'ve sent a confirmation link to your email'
          }
        </p>

        <div className="email-display">
          {email || 'your-email@example.com'}
        </div>

        <p className="verification-instructions">
          {context === 'login' 
            ? 'Check your email and click the verification link to activate your account and log in.' 
            : 'Please check your email and click on the confirmation link to proceed.'
          }
        </p>

        <p className="verification-note">
          If you don't see the email, check your spam or junk folder.
        </p>

        {resendMessage && (
          <div className={`message ${resendMessage.startsWith('Error') ? 'error' : 'success'}`}>
            {resendMessage}
          </div>
        )}

        <button 
          type="button"
          className="btn btn-secondary btn-full"
          onClick={handleResendEmail}
          disabled={isResending}
        >
          {isResending ? 'Sending...' : 'Resend Confirmation Email'}
        </button>

        <button 
          type="button"
          className="btn btn-primary btn-full"
          onClick={() => setCurrentAuthPage('login')}
        >
          Return to Login
        </button>

        <div className="support-link">
          <span>Need help? </span>
          <button 
            type="button" 
            className="link-button"
            onClick={() => {
              // You can implement a contact support feature here
              alert('Please contact support at support@company.com');
            }}
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;