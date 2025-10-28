import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './styles/LoginPage.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

function ResendVerificationPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage('Please enter your email address.');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/Auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Verification email sent successfully. Please check your inbox.');
        setMessageType('success');
        setEmail(''); // Clear the form
      } else {
        setMessage(data.message || 'Failed to send verification email. Please try again.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      setMessage('An error occurred. Please try again later.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-form">
          <div className="login-header">
            <h2>Resend Verification Email</h2>
            <p>Enter your email address to receive a new verification link.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                disabled={isLoading}
              />
            </div>

            {message && (
              <div className={`message ${messageType}`}>
                {message}
              </div>
            )}

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Verification Email'}
              </button>

              <button 
                type="button"
                className="btn-secondary"
                onClick={handleBackToLogin}
                disabled={isLoading}
              >
                Back to Login
              </button>
            </div>
          </form>

          <div className="login-footer">
            <p>
              Remember your password? <Link to="/login">Sign In</Link>
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

export default ResendVerificationPage;