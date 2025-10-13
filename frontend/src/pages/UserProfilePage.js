import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/config';
import { ReactComponent as TwoFactorIcon } from '../assets/two-factor-icon.svg';
import { ReactComponent as ShieldIcon } from '../assets/shield-icon.svg';

const UserProfilePage = ({ currentUser, userRole }) => {
  const [userProfile, setUserProfile] = useState({
    username: currentUser || 'Loading...',
    email: 'Loading...',
    password: '**********',
    role: userRole || 'Loading...',
    accountStatus: 'Loading...',
    twoFactorEnabled: false,
    emailVerified: false,
    lastLogin: 'Loading...',
    createdAt: 'Loading...'
  });

  const [loading, setLoading] = useState(true);

  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('jwt_token');
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        // Add timeout to fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(`${API_BASE_URL}/Auth/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          setUserProfile(data);
        } else {
          setError('Failed to fetch profile data. Please check if the backend server is running.');
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          setError('Request timeout. Please check if the backend server is running at http://localhost:5000');
        } else {
          setError('Network error: Unable to connect to the server. Please ensure the backend is running.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Auto-clear success/error messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleEmailChange = async () => {
    if (!newEmail) return;
    
    try {
      const token = localStorage.getItem('jwt_token');
      
      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${API_BASE_URL}/User/update-email`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newEmail }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setUserProfile(prev => ({ ...prev, email: newEmail }));
        setSuccess('Email updated successfully!');
        setShowChangeEmail(false);
        setNewEmail('');
      } else {
        setError('Failed to update email');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timeout. Please check if the backend server is running.');
      } else {
        setError('Network error updating email. Please ensure the backend is running.');
      }
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      const token = localStorage.getItem('jwt_token');
      
      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${API_BASE_URL}/User/update-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setSuccess('Password updated successfully!');
        setShowChangePassword(false);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError('Failed to update password');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timeout. Please check if the backend server is running.');
      } else {
        setError('Network error updating password. Please ensure the backend is running.');
      }
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '300px',
        fontSize: '18px',
        color: '#6b7280'
      }}>
        Loading profile...
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Card 1: User Profile Information */}
        <div className="card" style={{ flex: '1', padding: '30px 32px 20px' }}>
          <div style={{ marginBottom: '20px' }}>
            {/* Username - Inline */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              paddingBottom: '16px', 
              borderBottom: '1px solid #e5e7eb',
              marginBottom: '16px'
            }}>
              <label style={{ 
                fontWeight: 'bold', 
                color: '#111827', 
                minWidth: '130px',
                fontSize: '16px'
              }}>
                Username
              </label>
              <span style={{ 
                color: '#6b7280', 
                fontSize: '16px'
              }}>
                {userProfile.username}
              </span>
            </div>

            {/* Email Address - Inline */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              paddingBottom: '16px', 
              borderBottom: '1px solid #e5e7eb',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ 
                  fontWeight: 'bold', 
                  color: '#111827', 
                  minWidth: '130px',
                  fontSize: '16px'
                }}>
                  Email Address
                </label>
                <span style={{ 
                  color: '#6b7280', 
                  fontSize: '16px'
                }}>
                  {userProfile.email}
                </span>
              </div>
              {!showChangeEmail ? (
                <button 
                  type="button"
                  onClick={() => setShowChangeEmail(true)}
                  style={{
                    color: '#2563eb',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    textDecoration: 'underline'
                  }}
                >
                  Change
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new email"
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={handleEmailChange}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Save
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowChangeEmail(false)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Password - Inline */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              paddingBottom: '16px', 
              borderBottom: '1px solid #e5e7eb',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ 
                  fontWeight: 'bold', 
                  color: '#111827', 
                  minWidth: '130px',
                  fontSize: '16px'
                }}>
                  Password
                </label>
                <span style={{ 
                  color: '#6b7280', 
                  fontSize: '16px'
                }}>
                  **********
                </span>
              </div>
              {!showChangePassword ? (
                <button 
                  type="button"
                  onClick={() => setShowChangePassword(true)}
                  style={{
                    color: '#2563eb',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    textDecoration: 'underline'
                  }}
                >
                  Change
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '150px'
                      }}
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '150px'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      type="button"
                      onClick={handlePasswordChange}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Save
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowChangePassword(false)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Role - Inline */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '50px'
            }}>
              <label style={{ 
                fontWeight: 'bold', 
                color: '#111827', 
                minWidth: '130px',
                fontSize: '16px'
              }}>
                Role
              </label>
              <span style={{ 
                color: '#6b7280', 
                fontSize: '16px'
              }}>
                {userProfile.role}
              </span>
            </div>

            {/* Note */}
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#f9fafb', 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px',
              color: '#374151',
              lineHeight: '1.5',
            }}>
              <strong>PS:</strong> To change username, please contact us at{' '}
              <a 
                href="mailto:tank108@uni.coventry.ac.uk" 
                style={{ color: '#2563eb', textDecoration: 'underline' }}
              >
                tank108@uni.coventry.ac.uk
              </a>
            </div>
          </div>
        </div>

        {/* Card 2: Security Status (Top Right) */}
        <div className="card" style={{ flex: '1', padding: '30px 32px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ 
              width: '24px', 
              height: '24px', 
              borderRadius: '50%', 
              backgroundColor: '#f3f4f6', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginRight: '12px'
            }}>
              <ShieldIcon style={{ width: '16px', height: '16px', color: '#6b7280' }} />
            </div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Security Status</h3>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>Account Status</span>
              <span style={{
                backgroundColor: userProfile.accountStatus === 'Active' ? '#10b981' : '#ef4444',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                {userProfile.accountStatus}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>2FA Enabled</span>
              <span style={{ 
                color: userProfile.twoFactorEnabled ? '#10b981' : '#ef4444', 
                fontSize: '18px' 
              }}>
                {userProfile.twoFactorEnabled ? '✓' : '✗'}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>Email Verified</span>
              <span style={{ 
                color: userProfile.emailVerified ? '#10b981' : '#ef4444', 
                fontSize: '18px' 
              }}>
                {userProfile.emailVerified ? '✓' : '✗'}
              </span>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>Last Login</span>
              <span style={{ color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                {userProfile.lastLogin}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Two-Factor Authentication - Full Width */}
      <div className="card" style={{ padding: '10px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ 
              width: '24px', 
              height: '24px', 
              borderRadius: '50%', 
              backgroundColor: '#f3f4f6', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginRight: '16px'
            }}>
              <TwoFactorIcon style={{ width: '28px', height: '28px', color: '#6b7280' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                Two-Factor Authentication
              </h3>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                Currently {userProfile.twoFactorEnabled ? 'enabled' : 'disabled'}
              </p>
            </div>
          </div>
          <span style={{
            backgroundColor: userProfile.twoFactorEnabled ? '#10b981' : '#ef4444',
            color: 'white',
            padding: '6px 16px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {userProfile.twoFactorEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      {error && (
        <div style={{ 
          backgroundColor: '#fee2e2', 
          border: '1px solid #fecaca', 
          color: '#dc2626', 
          padding: '12px', 
          borderRadius: '8px', 
          marginTop: '16px' 
        }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ 
          backgroundColor: '#d1fae5', 
          border: '1px solid #a7f3d0', 
          color: '#065f46', 
          padding: '12px', 
          borderRadius: '8px', 
          marginTop: '16px' 
        }}>
          {success}
        </div>
      )}
    </>
  );
};

export default UserProfilePage;