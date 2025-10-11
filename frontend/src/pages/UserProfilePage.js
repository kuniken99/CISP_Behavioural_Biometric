import React, { useState } from 'react';
import { API_BASE_URL } from '../utils/config';

const UserProfilePage = ({ currentUser, userRole }) => {
  const [userProfile, setUserProfile] = useState({
    username: currentUser || 'darrell',
    email: 'j@gmail.com',
    password: '**********',
    role: userRole || 'admin',
    accountStatus: 'Active',
    twoFactorEnabled: true,
    lastLogin: '9/8/2025, 1:50:55 PM'
  });

  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleEmailChange = async () => {
    if (!newEmail) return;
    
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_BASE_URL}/User/update-email`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newEmail })
      });
      
      if (response.ok) {
        setUserProfile(prev => ({ ...prev, email: newEmail }));
        setSuccess('Email updated successfully!');
        setShowChangeEmail(false);
        setNewEmail('');
      } else {
        setError('Failed to update email');
      }
    } catch (err) {
      setError('Network error updating email');
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_BASE_URL}/User/update-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword })
      });
      
      if (response.ok) {
        setSuccess('Password updated successfully!');
        setShowChangePassword(false);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError('Failed to update password');
      }
    } catch (err) {
      setError('Network error updating password');
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-content">
        <div className="profile-main">
          <div className="profile-section">
            <div className="profile-field">
              <label className="profile-label">Username</label>
              <div className="profile-value">{userProfile.username}</div>
            </div>

            <div className="profile-field">
              <label className="profile-label">Email Address</label>
              <div className="profile-field-with-action">
                <div className="profile-value">{userProfile.email}</div>
                {!showChangeEmail ? (
                  <button 
                    type="button"
                    className="change-btn"
                    onClick={() => setShowChangeEmail(true)}
                  >
                    Change
                  </button>
                ) : (
                  <div className="change-form">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Enter new email"
                      className="change-input"
                    />
                    <button type="button" onClick={handleEmailChange} className="save-btn">Save</button>
                    <button type="button" onClick={() => setShowChangeEmail(false)} className="cancel-btn">Cancel</button>
                  </div>
                )}
              </div>
            </div>

            <div className="profile-field">
              <label className="profile-label">Password</label>
              <div className="profile-field-with-action">
                <div className="profile-value">{userProfile.password}</div>
                {!showChangePassword ? (
                  <button 
                    className="change-btn"
                    onClick={() => setShowChangePassword(true)}
                  >
                    Change
                  </button>
                ) : (
                  <div className="change-form">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="change-input"
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="change-input"
                    />
                    <button onClick={handlePasswordChange} className="save-btn">Save</button>
                    <button onClick={() => setShowChangePassword(false)} className="cancel-btn">Cancel</button>
                  </div>
                )}
              </div>
            </div>

            <div className="profile-field">
              <label className="profile-label">Role</label>
              <div className="profile-value">{userProfile.role}</div>
            </div>

            <div className="profile-note">
              <p><strong>PS:</strong> To change username, please contact us at <a href="mailto:tank108@uni.coventry.ac.uk">tank108@uni.coventry.ac.uk</a></p>
            </div>
          </div>

          <div className="two-factor-section">
            <div className="two-factor-header">
              <div className="two-factor-icon">☐</div>
              <div className="two-factor-info">
                <h3>Two-Factor Authentication</h3>
                <p>Currently enabled</p>
              </div>
              <div className="two-factor-status">
                <span className="status-badge enabled">Enabled</span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-sidebar">
          <div className="security-status">
            <div className="security-header">
              <span className="security-icon">🛡</span>
              <h3>Security Status</h3>
            </div>
            
            <div className="security-item">
              <span className="security-label">Account Status</span>
              <span className="status-badge active">{userProfile.accountStatus}</span>
            </div>

            <div className="security-item">
              <span className="security-label">2FA Enabled</span>
              <span className="security-checkmark">✓</span>
            </div>

            <div className="security-item">
              <span className="security-label">Last Login</span>
              <span className="security-time">{userProfile.lastLogin}</span>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
    </div>
  );
};

export default UserProfilePage;