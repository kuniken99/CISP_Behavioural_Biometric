// frontend/src/hooks/useCBBA.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { API_BASE_URL } from '../config/constants';

/**
 * CBBA Hook for Continuous Behavioral Biometric Authentication
 * Captures keystroke and mouse dynamics, sends to backend for risk assessment
 */
const useCBBA = (isAuthenticated, user, onRiskDetected) => {
  // State
  const [riskScore, setRiskScore] = useState(0);
  const [riskLevel, setRiskLevel] = useState('low');
  const [cbbaStatus, setCbbaStatus] = useState('Active');
  const [isTrained, setIsTrained] = useState(false);
  const [isTraining, setIsTraining] = useState(false);

  // Refs for data collection
  const keystrokeDataRef = useRef([]);
  const mouseDataRef = useRef([]);
  const sessionId = useRef(uuidv4());
  const collectionInterval = useRef(null);
  const assessmentInterval = useRef(null);
  
  // Keystroke tracking
  const keyPressTimesRef = useRef({});

  /**
   * Capture keystroke dynamics
   */
  const handleKeyDown = useCallback((event) => {
    if (!isAuthenticated) return;
    
    const timestamp = Date.now();
    const key = event.key;

    // Record key press time
    keyPressTimesRef.current[key] = timestamp;

    // Store event
    keystrokeDataRef.current.push({
      key: key,
      timestamp: timestamp,
      event: 'keydown'
    });
  }, [isAuthenticated]);

  const handleKeyUp = useCallback((event) => {
    if (!isAuthenticated) return;
    
    const timestamp = Date.now();
    const key = event.key;

    // Store event
    keystrokeDataRef.current.push({
      key: key,
      timestamp: timestamp,
      event: 'keyup'
    });

    // Clean up
    delete keyPressTimesRef.current[key];
  }, [isAuthenticated]);

  /**
   * Capture mouse dynamics
   */
  const lastMouseMoveRef = useRef(null);
  const mouseMoveThrottle = 50; // ms

  const handleMouseMove = useCallback((event) => {
    if (!isAuthenticated) return;
    
    const now = Date.now();
    
    // Throttle mouse move events
    if (lastMouseMoveRef.current && now - lastMouseMoveRef.current < mouseMoveThrottle) {
      return;
    }
    
    lastMouseMoveRef.current = now;

    mouseDataRef.current.push({
      x: event.clientX,
      y: event.clientY,
      timestamp: now,
      event: 'mousemove'
    });
    
    // DEBUG: Log occasionally (every 50th event)
    if (mouseDataRef.current.length % 50 === 0) {
      console.log('[CBBA MOUSE]', 'Total events:', mouseDataRef.current.length);
    }
  }, [isAuthenticated]);

  const handleMouseClick = useCallback((event) => {
    if (!isAuthenticated) return;

    const clickData = {
      x: event.clientX,
      y: event.clientY,
      timestamp: Date.now(),
      event: 'click',
      button: event.button
    };
    
    mouseDataRef.current.push(clickData);
    
    // DEBUG: Log every click
    console.log('[CBBA CLICK]', clickData, 'Total clicks:', mouseDataRef.current.filter(m => m.event === 'click').length);
  }, [isAuthenticated]);

  const handleScroll = useCallback((event) => {
    if (!isAuthenticated) return;

    mouseDataRef.current.push({
      deltaY: event.deltaY,
      deltaX: event.deltaX,
      timestamp: Date.now(),
      event: 'scroll'
    });
  }, [isAuthenticated]);

  /**
   * Assess risk score with backend
   */
  const assessRisk = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    // Need sufficient data
    if (keystrokeDataRef.current.length < 5 && mouseDataRef.current.length < 10) {
      console.log('[CBBA] Insufficient data for assessment (waiting for more interactions):', {
        keystroke: keystrokeDataRef.current.length,
        mouse: mouseDataRef.current.length,
        needed: 'keystroke >= 5 OR mouse >= 10'
      });
      return;
    }

    const assessmentTime = new Date().toLocaleTimeString();
    console.log(`[CBBA] ${assessmentTime} - Starting risk assessment:`, {
      keystroke: keystrokeDataRef.current.length,
      mouse: mouseDataRef.current.length,
      user: user || 'unknown'  // user is already a string (username)
    });

    // DEBUG: Log actual data being sent
    console.log('[CBBA DEBUG] Mouse data sample:', mouseDataRef.current.slice(0, 5));
    console.log('[CBBA DEBUG] Keystroke data sample:', keystrokeDataRef.current.slice(0, 5));

    try {
      const token = localStorage.getItem('jwt_token');
      
      // Copy and clear data
      const keystrokeData = [...keystrokeDataRef.current];
      const mouseData = [...mouseDataRef.current];
      
      // DEBUG: Log what's being sent
      console.log('[CBBA DEBUG] Sending to backend:', {
        keystrokeCount: keystrokeData.length,
        mouseCount: mouseData.length,
        mouseEventTypes: mouseData.map(m => m.event)
      });
      
      keystrokeDataRef.current = [];
      mouseDataRef.current = [];

      const response = await fetch(`${API_BASE_URL}/Biometric/assess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          keystrokeData,
          mouseData
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        console.log('[CBBA] Risk assessment result:', {
          riskScore: result.riskScore,
          riskLevel: result.riskLevel,
          status: result.status,
          action: result.action,
          isTrained: result.isTrained
        });
        
        // Update state with new values
        const newRiskScore = result.riskScore || 0;
        const newRiskLevel = result.riskLevel || 'low';
        const newIsTrained = result.isTrained || false;
        
        // Use functional updates to avoid stale closure issues
        setRiskScore(prevScore => {
          if (prevScore !== newRiskScore) {
            console.log(`[CBBA] Risk score updated: ${prevScore} → ${newRiskScore}`);
            return newRiskScore;
          }
          return prevScore;
        });
        
        setRiskLevel(prevLevel => {
          if (prevLevel !== newRiskLevel) {
            console.log(`[CBBA] Risk level updated: ${prevLevel} → ${newRiskLevel}`);
            return newRiskLevel;
          }
          return prevLevel;
        });
        
        setCbbaStatus(prevStatus => {
          if (prevStatus !== 'Active') {
            return 'Active';
          }
          return prevStatus;
        });
        
        setIsTrained(prevTrained => {
          if (prevTrained !== newIsTrained) {
            console.log(`[CBBA] Training status updated: ${prevTrained} → ${newIsTrained}`);
            
            // If user is not trained and on dashboard, redirect to training
            if (!newIsTrained && result.status === 'untrained') {
              console.log('[CBBA] User is untrained, redirecting to training page...');
              setTimeout(() => {
                window.location.href = '/training-progress';
              }, 1000);
              return newIsTrained;
            }
            
            return newIsTrained;
          }
          return prevTrained;
        });

        // Handle risk-based actions (only for trained users)
        if (newIsTrained) {
          if (result.action === 'challenge' && onRiskDetected) {
            console.log('[CBBA] Triggering step-up authentication challenge');
            onRiskDetected('challenge', result.riskScore);
          } else if (result.action === 'lock' && onRiskDetected) {
            console.log('[CBBA] Triggering session lock');
            onRiskDetected('lock', result.riskScore);
          }
        }
      } else {
        console.error('[CBBA] Risk assessment failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('CBBA risk assessment error:', error);
      setCbbaStatus('Error');
    }
  }, [isAuthenticated, user, onRiskDetected]);

  /**
   * Train user profile with behavioral data
   */
  const trainProfile = useCallback(async (trainingData) => {
    if (!isAuthenticated || !user) return { success: false, error: 'Not authenticated' };

    setIsTraining(true);

    try {
      const token = localStorage.getItem('jwt_token');
      
      const response = await fetch(`${API_BASE_URL}/Biometric/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ trainingData })
      });

      if (response.ok) {
        const result = await response.json();
        setIsTrained(true);
        setIsTraining(false);
        return { success: true, ...result };
      } else {
        const error = await response.json();
        setIsTraining(false);
        return { success: false, error: error.error || 'Training failed' };
      }
    } catch (error) {
      console.error('CBBA training error:', error);
      setIsTraining(false);
      return { success: false, error: error.message };
    }
  }, [isAuthenticated, user]);

  /**
   * Get profile status
   */
  const getProfileStatus = useCallback(async () => {
    if (!isAuthenticated || !user) return null;

    try {
      const token = localStorage.getItem('jwt_token');
      
      const response = await fetch(`${API_BASE_URL}/Biometric/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setIsTrained(result.isTrained || false);
        return result;
      }
    } catch (error) {
      console.error('CBBA status error:', error);
    }
    
    return null;
  }, [isAuthenticated, user]);

  /**
   * Setup event listeners
   */
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleMouseClick);
    window.addEventListener('wheel', handleScroll);

    // Start assessment interval (every 5 seconds for real-time updates)
    assessmentInterval.current = setInterval(assessRisk, 5000);

    // Initial status check
    getProfileStatus();
    
    // Trigger first assessment after 3 seconds (give time to collect initial data)
    setTimeout(assessRisk, 3000);

    return () => {
      // Remove event listeners
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleMouseClick);
      window.removeEventListener('wheel', handleScroll);

      // Clear intervals - copy ref to local variable to avoid stale closure
      const assessmentIntervalId = assessmentInterval.current;
      const collectionIntervalId = collectionInterval.current;
      
      if (assessmentIntervalId) {
        clearInterval(assessmentIntervalId);
      }
      if (collectionIntervalId) {
        clearInterval(collectionIntervalId);
      }
    };
  }, [isAuthenticated, handleKeyDown, handleKeyUp, handleMouseMove, handleMouseClick, handleScroll, assessRisk, getProfileStatus]);

  /**
   * Collect training data (for training phase)
   */
  const collectTrainingData = useCallback(() => {
    return {
      keystrokeData: [...keystrokeDataRef.current],
      mouseData: [...mouseDataRef.current]
    };
  }, []);

  /**
   * Clear collected data
   */
  const clearData = useCallback(() => {
    keystrokeDataRef.current = [];
    mouseDataRef.current = [];
  }, []);

  return {
    riskScore,
    riskLevel,
    cbbaStatus,
    isTrained,
    isTraining,
    sessionId: sessionId.current,
    trainProfile,
    getProfileStatus,
    collectTrainingData,
    clearData,
    assessRisk
  };
};

export default useCBBA;
