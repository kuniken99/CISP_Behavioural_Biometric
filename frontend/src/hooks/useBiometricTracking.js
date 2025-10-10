// frontend/src/hooks/useBiometricTracking.js
import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { API_BASE_URL, COLLECTION_INTERVAL_MS } from '../utils/config';

const useBiometricTracking = (isAuthenticated, handleLogout) => {
  const biometricEventsRef = useRef([]);
  const [sessionId, setSessionId] = useState('');
  const [cbbaStatus, setCbbaStatus] = useState('CBBA Monitoring started...');
  const [lastCbbaScore, setLastCbbaScore] = useState(null);
  const isSendingCbba = useRef(false);

  // Initialize session when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setSessionId(uuidv4());
    } else {
      biometricEventsRef.current = [];
      setSessionId('');
      setCbbaStatus('CBBA Monitoring stopped.');
      setLastCbbaScore(null);
    }
  }, [isAuthenticated]);

  // Event listeners for biometric data collection
  useEffect(() => {
    if (!isAuthenticated) return;

    let lastMouseMoveTime = 0;
    const MOUSE_MOVE_THROTTLE = 100; // Only capture mouse moves every 100ms

    const handleKeyPress = (event) => {
      const newEvent = { type: 'key_press', key: event.key, time: Date.now() / 1000 };
      biometricEventsRef.current.push(newEvent);
    };

    const handleKeyRelease = (event) => {
      const newEvent = { type: 'key_release', key: event.key, time: Date.now() / 1000 };
      biometricEventsRef.current.push(newEvent);
    };

    const handleMouseMove = (event) => {
      const now = Date.now();
      if (now - lastMouseMoveTime < MOUSE_MOVE_THROTTLE) return;
      lastMouseMoveTime = now;
      
      const newEvent = {
        type: 'mouse_move',
        x: event.clientX,
        y: event.clientY,
        time: now / 1000,
      };
      biometricEventsRef.current.push(newEvent);
    };

    const handleMouseClick = (event) => {
      const newEvent = {
        type: 'mouse_click',
        x: event.clientX,
        y: event.clientY,
        time: Date.now() / 1000,
      };
      biometricEventsRef.current.push(newEvent);
    };

    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('keyup', handleKeyRelease);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleMouseClick);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('keyup', handleKeyRelease);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleMouseClick);
    };
  }, [isAuthenticated]);

  // CBBA Data Sending
  useEffect(() => {
    if (!isAuthenticated || !sessionId) return;

    const interval = setInterval(async () => {
      if (isSendingCbba.current || biometricEventsRef.current.length === 0) return;
      isSendingCbba.current = true;

      const currentEvents = [...biometricEventsRef.current];
      biometricEventsRef.current = [];

      try {
        const token = localStorage.getItem('jwt_token');
        const response = await fetch(`${API_BASE_URL}/Biometric/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(currentEvents),
        });

        if (response.ok) {
          const data = await response.json();
          setLastCbbaScore(data.score);
          if (response.status === 200) {
            setCbbaStatus(`CBBA: Normal behavior. Score: ${data.score.toFixed(4)}`);
          } else if (response.status === 403) {
            setCbbaStatus(`!!! CBBA ANOMALY DETECTED !!! Score: ${data.score.toFixed(4)} - Session Locked!`);
            handleLogout();
            alert('Security Anomaly Detected! Your session has been terminated.');
          }
        } else {
          const errorData = await response.json();
          setCbbaStatus(`CBBA Error: ${errorData.message || response.statusText}`);
        }
      } catch (error) {
        console.error('CBBA Network or API error:', error);
        setCbbaStatus(`CBBA Network Error: ${error.message}`);
      } finally {
        isSendingCbba.current = false;
      }
    }, COLLECTION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [sessionId, isAuthenticated, handleLogout]);

  return {
    cbbaStatus,
    lastCbbaScore,
    sessionId
  };
};

export default useBiometricTracking;