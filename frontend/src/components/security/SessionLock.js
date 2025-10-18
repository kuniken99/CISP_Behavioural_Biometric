// frontend/src/components/security/SessionLock.js
import React, { useState, useEffect } from 'react';
import '../../styles/SessionLock.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

/**
 * Session Lock Component
 * Displayed when high risk is detected (80%+)
 * Locks account temporarily for 15 minutes
 * Full-screen overlay with blur - user cannot dismiss
 */
const SessionLock = ({ show, riskScore, onLockExpired, username }) => {
  const [timeRemaining, setTimeRemaining] = useState(15 * 60); // 15 minutes in seconds
  const [lockDetails, setLockDetails] = useState({
    multipleFailedLogins: false,
    unusualLocation: false,
    suspiciousFingerprint: false
  });

  // Initialize lock when shown
  useEffect(() => {
    if (show) {
      // Set lock timestamp
      const lockTime = new Date();
      const unlockTime = new Date(lockTime.getTime() + 15 * 60 * 1000);
      localStorage.setItem('lockTimestamp', lockTime.toISOString());
      localStorage.setItem('unlockTimestamp', unlockTime.toISOString());
      
      // Log the lock event
      logLockEvent(riskScore);
      
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [show, riskScore]);

  // Countdown timer
  useEffect(() => {
    if (!show) return;

    const interval = setInterval(() => {
      const unlockTime = localStorage.getItem('unlockTimestamp');
      if (unlockTime) {
        const now = new Date();
        const unlock = new Date(unlockTime);
        const diff = Math.floor((unlock - now) / 1000);
        
        if (diff <= 0) {
          setTimeRemaining(0);
          clearInterval(interval);
          // Unlock and allow re-login
          handleLockExpired();
        } else {
          setTimeRemaining(diff);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [show]);

  const logLockEvent = async (risk) => {
    try {
      const token = localStorage.getItem('jwt_token');
      await fetch(`${API_BASE_URL}/api/Audit/log-session-lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          riskScore: risk,
          lockDuration: 15,
          reason: 'High risk detected by CBBA system'
        })
      });
    } catch (error) {
      console.error('[SessionLock] Failed to log lock event:', error);
    }
  };

  const handleLockExpired = () => {
    localStorage.removeItem('lockTimestamp');
    localStorage.removeItem('unlockTimestamp');
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    
    if (onLockExpired) {
      onLockExpired();
    }
  };

  const handleContactSupport = () => {
    alert('Please contact support:\n\nEmail: support@cbba-system.com\nPhone: +1-800-SECURITY\n\nProvide your username and the session ID shown below.');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!show) return null;

  return (
    <div className="session-lock-overlay">
      <div className="session-lock-backdrop"></div>
      
      <div className="session-lock-container">
        {/* Header with shield icon */}
        <div className="lock-header">
          <div className="lock-shield-container">
            <div className="lock-shield">
              <div className="shield-icon">🛡️</div>
              <div className="shield-x">✖</div>
            </div>
            <div className="lock-pulse-ring"></div>
          </div>
        </div>

        {/* Title */}
        <h1 className="lock-title">Account Temporarily Locked</h1>
        
        {/* Description */}
        <p className="lock-description">
          Your account has been locked due to suspicious activity detected. 
          This is a security measure to protect your account.
        </p>

        {/* Lockout Duration Timer */}
        <div className="lockout-timer-section">
          <div className="timer-icon">⏱️</div>
          <div className="timer-label">Lockout Duration</div>
          <div className="timer-display">
            <span className="timer-value">{formatTime(timeRemaining)}</span>
          </div>
          <div className="timer-sublabel">minutes remaining</div>
        </div>

        {/* Threat Details */}
        <div className="threat-details-section">
          <h3 className="threat-title">Threat Details:</h3>
          <div className="threat-list">
            <div className="threat-item">
              <span className="threat-bullet">•</span>
              <span className="threat-text">Multiple failed login attempts</span>
            </div>
            <div className="threat-item">
              <span className="threat-bullet">•</span>
              <span className="threat-text">Login from unusual location</span>
            </div>
            <div className="threat-item">
              <span className="threat-bullet">•</span>
              <span className="threat-text">Suspicious device fingerprint</span>
            </div>
          </div>
        </div>

        {/* Contact Support Button */}
        <div className="lock-actions">
          <button 
            type="button"
            className="btn-contact-support"
            onClick={handleContactSupport}
          >
            <span className="btn-icon">📞</span>
            <span>Contact Support</span>
          </button>
        </div>

        {/* Footer Message */}
        <div className="lock-footer">
          <p className="footer-message">
            If you believe this is an error, please contact our security team.
          </p>
          <p className="session-info">
            Session ID: {localStorage.getItem('sessionId') || 'N/A'} • 
            Username: {username || 'Unknown'}
          </p>
        </div>

        {/* Security Badge */}
        <div className="security-badge">
          <span className="badge-icon">🔒</span>
          <span className="badge-text">Protected by CBBA Security</span>
        </div>
      </div>
    </div>
  );
};

export default SessionLock;
