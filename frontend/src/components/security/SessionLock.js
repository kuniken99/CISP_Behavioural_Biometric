// frontend/src/components/security/SessionLock.js
import React, { useState, useEffect } from 'react';
import '../../styles/SessionLock.css';
import lockShieldIcon from '../../assets/lock-shield-icon.svg';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

/**
 * Session Lock Component
 * Displayed when high risk is detected (80%+)
 * Locks account temporarily for 15 minutes
 * Full-screen overlay with blur - user cannot dismiss
 */
const SessionLock = ({ show, riskScore, onLockExpired, username, threatDetails }) => {
  const [timeRemaining, setTimeRemaining] = useState(15 * 60); // 15 minutes in seconds

  console.log('[SessionLock] Component rendered - show:', show, 'riskScore:', riskScore);

  // Initialize lock when shown
  useEffect(() => {
    if (show) {
      console.log('[SessionLock] Modal is showing - initializing lock');
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
      await fetch(`${API_BASE_URL}/Audit/log-session-lock`, {
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

  const handleLockExpired = async () => {
    try {
      // Clear the lock in backend session
      const token = localStorage.getItem('jwt_token');
      await fetch(`${API_BASE_URL}/biometric/clear-lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      console.log('[SessionLock] Lock cleared from backend session');
    } catch (error) {
      console.error('[SessionLock] Failed to clear lock:', error);
    }
    
    // Clear local storage
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
    alert('Please contact support:\n\nEmail: tank108@uni.coventry.ac.uk\n\nProvide your username.');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!show) return null;

  // Get threat details from props or use default
  const threats = threatDetails || [
    'Unusual Behaviour Detected',
  ];

  return (
    <div className="session-lock-overlay">
      <div className="session-lock-backdrop"></div>
      
      <div className="session-lock-container">
        {/* Header with shield icon */}
        <div className="lock-header">
          <div className="lock-shield-container">
            <img src={lockShieldIcon} alt="Lock Shield" className="lock-shield-icon" />
          </div>
        </div>

        {/* Title */}
        <h1 className="lock-title">Account Temporarily Locked</h1>
        
        {/* Risk Score Badge */}
        {riskScore && (
          <div className="risk-score-badge">
            <span className="risk-icon">⚠️</span>
            <span className="risk-label">Risk Level:</span>
            <span className="risk-value">{Math.round(riskScore)}%</span>
          </div>
        )}
        
        {/* Description */}
        <p className="lock-description">
          <span className="description-highlight">Your account has been locked</span> due to suspicious activity detected. 
          This is a security measure to protect your account.
        </p>

        {/* Lockout Duration Timer */}
        <div className="lockout-timer-section">
          <div className="timer-label">⏱ Lockout Duration</div>
          <div className="timer-display">
            <span className="timer-value">{formatTime(timeRemaining)}</span>
          </div>
          <div className="footer-highlight">minutes remaining</div>
        </div>

        {/* Threat Details */}
        <div className="threat-details-section">
          <h3 className="threat-title">Threat Details:</h3>
          <div className="threat-list">
            {threats.map((threat, index) => (
              <div key={index} className="threat-item">
                <span className="threat-bullet">•</span>
                <span className="threat-text">{threat}</span>
              </div>
            ))}
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

      </div>
    </div>
  );
};

export default SessionLock;
