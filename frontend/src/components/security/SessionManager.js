import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../utils/config';

const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
const WARNING_TIME = 60 * 1000; // Show warning 1 minute before timeout
const ACTIVITY_CHECK_INTERVAL = 5000; // Check every 5 seconds
const ACTIVITY_THROTTLE = 2000; // Throttle activity updates to once per 2 seconds

// const SESSION_TIMEOUT = 1 * 60 * 1000; // 1 minute for testing (normally 15 minutes)
// const WARNING_TIME = 15 * 1000; // Show warning 15 seconds before timeout (for testing)
// const ACTIVITY_CHECK_INTERVAL = 1000; // Check every 1 second for testing (normally 5000)
// const ACTIVITY_THROTTLE = 1000; // Throttle to 1 second for testing (normally 2000)

const SessionManager = () => {
    const [lastActivity, setLastActivity] = useState(Date.now());
    const [showWarning, setShowWarning] = useState(false);
    const [remainingTime, setRemainingTime] = useState(SESSION_TIMEOUT);
    const navigate = useNavigate();
    const checkIntervalRef = useRef(null);
    const lastActivityUpdateRef = useRef(Date.now());

    const resetTimer = useCallback(() => {
        const now = Date.now();
        setLastActivity(now);
        lastActivityUpdateRef.current = now;
        setShowWarning(false);
        setRemainingTime(SESSION_TIMEOUT);
    }, []);

    const handleLogout = useCallback(async (reason = 'timeout') => {
        try {
            const token = localStorage.getItem('jwt_token') || localStorage.getItem('token');
            if (token) {
                // Call logout API with timeout handling
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                try {
                    await fetch(`${API_BASE_URL}/Auth/logout`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        signal: controller.signal
                    });
                } catch (fetchError) {
                    console.warn('Logout API call failed:', fetchError);
                    // Continue with cleanup even if API call fails
                } finally {
                    clearTimeout(timeoutId);
                }
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear all local storage
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('current_user');
            localStorage.removeItem('user_role');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('sessionId');
            localStorage.removeItem('userRole');
            localStorage.removeItem('username');
            
            // Clear all session storage
            sessionStorage.clear();
            
            // Clear all timers
            if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
            
            // Navigate to login with appropriate message
            const message = reason === 'manual' 
                ? 'You have been logged out successfully.' 
                : 'Your session has expired due to inactivity. Please log in again.';
            
            navigate('/login', { 
                state: { message },
                replace: true // Use replace to avoid adding to history
            });
        }
    }, [navigate]);

    // Check token expiration
    const checkTokenExpiration = useCallback(() => {
        const token = localStorage.getItem('jwt_token') || localStorage.getItem('token');
        if (!token) {
            handleLogout('no-token');
            return false;
        }

        try {
            // Decode JWT token (simple base64 decode)
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expirationTime = payload.exp * 1000; // Convert to milliseconds
            const now = Date.now();
            const timeUntilExpiration = expirationTime - now;

            if (timeUntilExpiration <= 0) {
                // Token has expired
                console.warn('Token has expired');
                handleLogout('token-expired');
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error decoding token:', error);
            handleLogout('invalid-token');
            return false;
        }
    }, [handleLogout]);

    useEffect(() => {
        const token = localStorage.getItem('jwt_token') || localStorage.getItem('token');
        if (!token) return; // Don't run if not logged in

        // Use only essential events, removed mousemove to prevent excessive triggers
        const events = ['mousedown', 'keydown', 'click', 'touchstart'];
        
        const handleActivity = () => {
            // Don't process activity when warning is shown
            // Only allow explicit button clicks to extend session
            if (showWarning) {
                return;
            }

            const now = Date.now();
            // Throttle: only update if ACTIVITY_THROTTLE ms have passed since last update
            if (now - lastActivityUpdateRef.current < ACTIVITY_THROTTLE) {
                return;
            }

            // Verify token is still valid before resetting timer
            if (checkTokenExpiration()) {
                lastActivityUpdateRef.current = now;
                setLastActivity(now);
            }
        };

        // Add event listeners for user activity
        events.forEach(event => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

        // Set up interval to check session timeout and token expiration
        checkIntervalRef.current = setInterval(() => {
            // Check token expiration first
            if (!checkTokenExpiration()) {
                return;
            }

            const now = Date.now();
            const timeSinceLastActivity = now - lastActivity;
            const timeRemaining = SESSION_TIMEOUT - timeSinceLastActivity;

            // Only update remaining time when warning is shown (prevent unnecessary re-renders)
            if (showWarning && timeRemaining > 0) {
                setRemainingTime(timeRemaining);
            }

            if (timeRemaining <= 0) {
                handleLogout('timeout');
            } else if (timeRemaining <= WARNING_TIME && !showWarning) {
                setShowWarning(true);
                setRemainingTime(timeRemaining);
            }
        }, ACTIVITY_CHECK_INTERVAL);

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
            if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
        };
    }, [lastActivity, handleLogout, showWarning, checkTokenExpiration]);

    const handleExtendSession = () => {
        if (checkTokenExpiration()) {
            resetTimer();
        }
    };

    const formatTime = (ms) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const progress = (remainingTime / SESSION_TIMEOUT) * 100;

    if (!showWarning) {
        return null;
    }

    // Prevent clicks outside the dialog from propagating
    const handleOverlayClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
    };

    const handleDialogClick = (e) => {
        e.stopPropagation();
    };

    return (
        <div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000
            }}
            onClick={handleOverlayClick}
            onMouseDown={handleOverlayClick}
            onKeyDown={handleOverlayClick}
        >
            <div 
                style={{
                    backgroundColor: '#ffffff',
                    padding: '40px',
                    borderRadius: '8px',
                    maxWidth: '450px',
                    width: '90%',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    border: '1px solid #e0e0e0'
                }}
                onClick={handleDialogClick}
            >
                <h2 style={{
                    color: '#000000',
                    marginBottom: '16px',
                    marginTop: '0',
                    fontSize: '20px',
                    fontWeight: '600',
                    textAlign: 'center'
                }}>
                    Session Timeout Warning
                </h2>
                <p style={{
                    color: '#333333',
                    marginBottom: '24px',
                    fontSize: '15px',
                    lineHeight: '1.5',
                    textAlign: 'center'
                }}>
                    Your session will expire in <strong>{formatTime(remainingTime)}</strong> due to inactivity.
                </p>
                <div style={{
                    backgroundColor: '#f0f0f0',
                    borderRadius: '4px',
                    height: '8px',
                    overflow: 'hidden',
                    marginBottom: '28px'
                }}>
                    <div style={{
                        height: '100%',
                        width: `${progress}%`,
                        backgroundColor: '#000000',
                        transition: 'width 0.3s ease-out',
                        willChange: 'width'
                    }}></div>
                </div>
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'center'
                }}>
                    <button
                        onClick={() => handleLogout('manual')}
                        style={{
                            padding: '10px 24px',
                            backgroundColor: '#ffffff',
                            color: '#000000',
                            border: '1px solid #000000',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#f5f5f5';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#ffffff';
                        }}
                    >
                        Logout
                    </button>
                    <button
                        onClick={handleExtendSession}
                        style={{
                            padding: '10px 24px',
                            backgroundColor: '#000000',
                            color: '#ffffff',
                            border: '1px solid #000000',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#333333';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#000000';
                        }}
                        autoFocus
                    >
                        Continue Session
                    </button>
                </div>
            </div>
        </div>
    );
};

// Use React.memo to prevent unnecessary re-renders
export default React.memo(SessionManager);
