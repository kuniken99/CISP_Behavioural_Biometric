import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../utils/config';

const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
const WARNING_TIME = 60 * 1000; // Show warning 1 minute before timeout

const SessionManager = () => {
    const [lastActivity, setLastActivity] = useState(Date.now());
    const [showWarning, setShowWarning] = useState(false);
    const [remainingTime, setRemainingTime] = useState(SESSION_TIMEOUT);
    const navigate = useNavigate();
    const logoutTimerRef = useRef(null);
    const warningTimerRef = useRef(null);

    const resetTimer = useCallback(() => {
        setLastActivity(Date.now());
        setShowWarning(false);
        setRemainingTime(SESSION_TIMEOUT);
    }, []);

    const handleLogout = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                // Call logout API
                await fetch(`${API_BASE_URL}/Auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            // Clear all local storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('sessionId');
            
            // Clear timers
            if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
            if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
            
            // Navigate to login
            navigate('/login', { 
                state: { message: 'Your session has expired due to inactivity. Please log in again.' }
            });
        }
    }, [navigate]);

    useEffect(() => {
        const events = ['mousedown', 'keydown', 'scroll', 'mousemove', 'touchstart', 'click'];
        
        const handleActivity = () => {
            resetTimer();
        };

        // Add event listeners for user activity
        events.forEach(event => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

        // Set up interval to check session timeout
        const interval = setInterval(() => {
            const now = Date.now();
            const timeSinceLastActivity = now - lastActivity;
            const timeRemaining = SESSION_TIMEOUT - timeSinceLastActivity;

            setRemainingTime(timeRemaining);

            if (timeRemaining <= 0) {
                handleLogout();
            } else if (timeRemaining <= WARNING_TIME && !showWarning) {
                setShowWarning(true);
            }
        }, 1000);

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
            clearInterval(interval);
            if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
            if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        };
    }, [lastActivity, handleLogout, resetTimer, showWarning]);

    const handleExtendSession = () => {
        resetTimer();
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

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
        }}>
            <div style={{
                backgroundColor: '#1f2937',
                padding: '30px',
                borderRadius: '12px',
                maxWidth: '500px',
                width: '90%',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                border: '1px solid #374151'
            }}>
                <h2 style={{
                    color: '#f59e0b',
                    marginBottom: '20px',
                    fontSize: '24px',
                    fontWeight: 'bold'
                }}>
                    ⚠️ Session Timeout Warning
                </h2>
                <p style={{
                    color: '#e5e7eb',
                    marginBottom: '20px',
                    fontSize: '16px',
                    lineHeight: '1.6'
                }}>
                    Your session will expire in <strong style={{ color: '#f59e0b' }}>{formatTime(remainingTime)}</strong> due to inactivity.
                    <br />
                    Would you like to extend your session?
                </p>
                <div style={{
                    backgroundColor: '#374151',
                    borderRadius: '8px',
                    height: '10px',
                    overflow: 'hidden',
                    marginBottom: '25px'
                }}>
                    <div style={{
                        height: '100%',
                        width: `${progress}%`,
                        backgroundColor: progress < 30 ? '#ef4444' : progress < 60 ? '#f59e0b' : '#10b981',
                        transition: 'width 1s linear, background-color 0.5s ease'
                    }}></div>
                </div>
                <div style={{
                    display: 'flex',
                    gap: '15px',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#374151',
                            color: '#ef4444',
                            border: '1px solid #ef4444',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#ef4444';
                            e.target.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#374151';
                            e.target.style.color = '#ef4444';
                        }}
                    >
                        Logout Now
                    </button>
                    <button
                        onClick={handleExtendSession}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#10b981',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#059669';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#10b981';
                        }}
                        autoFocus
                    >
                        Extend Session
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionManager;
