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
  const [trainingMode, setTrainingMode] = useState(false); // Flag to suppress alerts during training

  // Refs for data collection
  const keystrokeDataRef = useRef([]);
  const mouseDataRef = useRef([]);
  const sessionStartRef = useRef(null);
  const sessionId = useRef(uuidv4());
  const collectionInterval = useRef(null);
  const assessmentInterval = useRef(null);
  const trainingModeRef = useRef(false); // Ref for immediate access in callbacks
  // Training capture helpers
  const trainingSamplesRef = useRef([]); // array of { keystrokeData, mouseData }
  const trainingCaptureInterval = useRef(null);
  
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
  }, [isAuthenticated]);

  const handleMouseClick = useCallback((event) => {
    if (!isAuthenticated) return;

    mouseDataRef.current.push({
      x: event.clientX,
      y: event.clientY,
      timestamp: Date.now(),
      event: 'click',
      button: event.button
    });
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

    // Minimum data thresholds for accurate assessment (LOWERED for better responsiveness)
    const MIN_KEYSTROKE_EVENTS = 4;   // At least 2 key presses (keydown + keyup)
    const MIN_MOUSE_EVENTS = 10;      // At least 10 mouse movements
    
    const hasEnoughKeystroke = keystrokeDataRef.current.length >= MIN_KEYSTROKE_EVENTS;
    const hasEnoughMouse = mouseDataRef.current.length >= MIN_MOUSE_EVENTS;
    
    // Need sufficient data (require at least ONE: keystroke OR mouse) or use time-based override
    const now = Date.now();
    const sessionStart = sessionStartRef.current || now;
    const elapsedSeconds = Math.max(0, Math.floor((now - sessionStart) / 1000));

    // If we've been collecting for a while, allow a relaxed assessment to avoid sticking at default
    const MAX_WAIT_SECONDS = 15;  // Reduced from 30s
    const RELAXED_KEYSTROKE_EVENTS = 2;  // Just 1 keypress
    const RELAXED_MOUSE_EVENTS = 5;      // Just 5 mouse movements

    const timeOverride = elapsedSeconds >= MAX_WAIT_SECONDS &&
      (keystrokeDataRef.current.length >= RELAXED_KEYSTROKE_EVENTS || mouseDataRef.current.length >= RELAXED_MOUSE_EVENTS);

    // Need sufficient data or time-based override
    if (!hasEnoughKeystroke && !hasEnoughMouse && !timeOverride) {
      console.log('[CBBA] Insufficient data for assessment (collecting baseline):', {
        keystroke: `${keystrokeDataRef.current.length}/${MIN_KEYSTROKE_EVENTS}`,
        mouse: `${mouseDataRef.current.length}/${MIN_MOUSE_EVENTS}`,
        elapsedSeconds: elapsedSeconds,
        status: 'waiting for more interactions'
      });
      
      // Set default low risk during data collection phase
      setRiskScore(15);
      setRiskLevel('low');
      return;
    }

    const assessmentTime = new Date().toLocaleTimeString();
    console.log(`[CBBA] ${assessmentTime} - Starting risk assessment:`, {
      keystroke: keystrokeDataRef.current.length,
      mouse: mouseDataRef.current.length,
      user: user || 'unknown'  // user is already a string (username)
    });

    try {
      const token = localStorage.getItem('jwt_token');
      
      // Copy and clear data
      const keystrokeData = [...keystrokeDataRef.current];
      const mouseData = [...mouseDataRef.current];
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
        console.log('[CBBA] Raw response:', result);
        
        console.log('[CBBA] Risk assessment result:', {
          riskScore: result.riskScore,
          riskLevel: result.riskLevel,
          status: result.status,
          action: result.action,
          isTrained: result.isTrained
        });
        
  // Update state with new values (handle different response shapes)
  const newRiskScore = (result.riskScore !== undefined) ? result.riskScore : (result.risk_score !== undefined ? result.risk_score : 0);
  const newRiskLevel = result.riskLevel || result.risk_level || 'low';
  const newIsTrained = result.isTrained || result.is_trained || false;
        
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
            return newIsTrained;
          }
          return prevTrained;
        });

        // Handle risk-based actions (SKIP if in training mode)
        if (!trainingModeRef.current) {
          if (result.action === 'challenge' && onRiskDetected) {
            console.log('[CBBA] Triggering step-up authentication challenge');
            onRiskDetected('challenge', result.riskScore);
          } else if (result.action === 'lock' && onRiskDetected) {
            console.log('[CBBA] Triggering session lock');
            onRiskDetected('lock', result.riskScore);
          }
        } else {
          console.log('[CBBA] 🟢 Training mode active - suppressing step-up auth/lock for risk:', result.riskScore, result.action);
        }
      } else {
        // Non-OK response - try to parse and update UI conservatively
        let errorBody = null;
        try { errorBody = await response.json(); } catch (e) { errorBody = null; }
        console.error('[CBBA] Risk assessment failed:', response.status, response.statusText, errorBody);

        const fallbackScore = (errorBody && (errorBody.riskScore || errorBody.risk_score)) ? (errorBody.riskScore || errorBody.risk_score) : 50;
        setRiskScore(fallbackScore);
        setRiskLevel((errorBody && (errorBody.riskLevel || errorBody.risk_level)) ? (errorBody.riskLevel || errorBody.risk_level) : 'unknown');
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

  // Mark session start time
  sessionStartRef.current = Date.now();

  // Start assessment interval (every 3 seconds for responsive real-time updates)
    assessmentInterval.current = setInterval(assessRisk, 3000);

    // Initial status check
    getProfileStatus();
    
    // Trigger first assessment after 10 seconds (give time to collect sufficient baseline data)
    setTimeout(assessRisk, 10000);

    // Expose dev helpers on window for easy manual training (development only)
    try {
      if (typeof window !== 'undefined') {
        window.cbba = window.cbba || {};
        window.cbba.startTrainingCapture = startTrainingCapture;
        window.cbba.stopTrainingCapture = stopTrainingCapture;
        window.cbba.trainWithCollectedData = trainWithCollectedData;
        window.cbba.getCollectedTrainingSamples = () => trainingSamplesRef.current;
        window.cbba.resetRiskScore = resetRiskScore;
        window.cbba.enableTrainingMode = () => { 
          trainingModeRef.current = true;
          setTrainingMode(true); 
          console.log('[CBBA] 🟢 Training mode ENABLED manually'); 
        };
        window.cbba.disableTrainingMode = () => { 
          trainingModeRef.current = false;
          setTrainingMode(false); 
          console.log('[CBBA] 🔴 Training mode DISABLED manually'); 
        };
        window.cbba.getTrainingMode = () => trainingModeRef.current;
      }
    } catch (e) {
      // ignore in non-browser environments
    }

    return () => {
      // Remove event listeners
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleMouseClick);
      window.removeEventListener('wheel', handleScroll);

      // Clear intervals
      if (assessmentInterval.current) {
        clearInterval(assessmentInterval.current);
      }
      if (trainingCaptureInterval.current) {
        clearInterval(trainingCaptureInterval.current);
      }
      // Reset session start
      sessionStartRef.current = null;
      if (collectionInterval.current) {
        clearInterval(collectionInterval.current);
      }
      // Remove dev helpers
      try {
        if (typeof window !== 'undefined' && window.cbba) {
          delete window.cbba.startTrainingCapture;
          delete window.cbba.stopTrainingCapture;
          delete window.cbba.trainWithCollectedData;
          delete window.cbba.getCollectedTrainingSamples;
        }
      } catch (e) {
        // ignore
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
   * Start capturing training samples periodically
   * Each sample will be a snapshot of the current buffer
   */
  const startTrainingCapture = useCallback((intervalMs = 5000) => {
    if (trainingCaptureInterval.current) {
      console.warn('[CBBA Training] Capture already running. Stop it first with stopTrainingCapture()');
      return false;
    }
    
    // Enable training mode to suppress step-up auth
    trainingModeRef.current = true;
    setTrainingMode(true);
    console.log('[CBBA Training] 🟢 Training mode ENABLED - step-up auth suppressed');
    console.log(`[CBBA Training] Started capturing samples every ${intervalMs}ms. Use the app normally (type, move mouse, click).`);
    console.log('[CBBA Training] Check progress with: window.cbba.getCollectedTrainingSamples().length');
    
    trainingCaptureInterval.current = setInterval(() => {
      const sample = collectTrainingData();
      // Only store if there is some meaningful data
      if (sample.keystrokeData.length > 5 || sample.mouseData.length > 10) {
        trainingSamplesRef.current.push(sample);
        const count = trainingSamplesRef.current.length;
        
        // Log every 10 samples
        if (count % 10 === 0) {
          console.log(`[CBBA Training] Collected ${count} samples so far...`);
        }
        
        // keep training samples bounded
        if (trainingSamplesRef.current.length > 200) {
          trainingSamplesRef.current.shift();
        }
      }
    }, intervalMs);
    return true;
  }, [collectTrainingData]);

  const stopTrainingCapture = useCallback(() => {
    if (trainingCaptureInterval.current) {
      clearInterval(trainingCaptureInterval.current);
      trainingCaptureInterval.current = null;
      const count = trainingSamplesRef.current.length;
      
      // Disable training mode
      trainingModeRef.current = false;
      setTrainingMode(false);
      console.log('[CBBA Training] 🔴 Training mode DISABLED - step-up auth re-enabled');
      console.log(`[CBBA Training] Stopped capture. Total samples collected: ${count}`);
      if (count > 0) {
        console.log('[CBBA Training] Ready to train! Run: window.cbba.trainWithCollectedData().then(console.log)');
      } else {
        console.warn('[CBBA Training] No samples collected. Make sure to interact with the app (type, move mouse) while capturing.');
      }
      return true;
    }
    console.warn('[CBBA Training] Capture is not running.');
    return false;
  }, []);

  /**
   * Send collected training samples to backend for model training
   */
  const trainWithCollectedData = useCallback(async () => {
    if (!isAuthenticated || !user) {
      console.error('[CBBA Training] Not authenticated');
      return { success: false, error: 'Not authenticated' };
    }
    
    if (!trainingSamplesRef.current || trainingSamplesRef.current.length === 0) {
      console.error('[CBBA Training] No training samples collected. Start capture first with: window.cbba.startTrainingCapture(5000)');
      return { success: false, error: 'No training samples collected. Use startTrainingCapture() first.' };
    }

    const sampleCount = trainingSamplesRef.current.length;
    console.log(`[CBBA Training] Preparing to train with ${sampleCount} samples...`);

    // Prepare payload - backend expects { trainingData: [{ keystrokeData, mouseData }] }
    // Filter out completely empty samples (must have EITHER keystroke OR mouse data)
    const payload = trainingSamplesRef.current
      .filter(s => {
        const hasKeystroke = s.keystrokeData && s.keystrokeData.length >= 2; // Lowered: at least 1 keypress (2 events)
        const hasMouse = s.mouseData && s.mouseData.length >= 5; // Lowered: at least 5 mouse movements
        return hasKeystroke || hasMouse; // Accept either type (not both required)
      })
      .map(s => ({
        keystrokeData: s.keystrokeData || [],
        mouseData: s.mouseData || []
      }));

    const minSamples = 5; // Lowered from 10 for easier development testing
    if (payload.length < minSamples) {
      console.error(`[CBBA Training] Insufficient samples. Need at least ${minSamples} samples with behavioral data.`);
      return { 
        success: false, 
        error: `Insufficient samples (${payload.length}/${minSamples}). Each sample needs keystroke (2+) OR mouse (5+) events. Collect more samples with interaction.` 
      };
    }

    console.log('[CBBA Training] Payload preview:', {
      totalSamples: sampleCount,
      completeSamples: payload.length,
      filteredOut: sampleCount - payload.length,
      firstSample: {
        keystrokeCount: payload[0]?.keystrokeData?.length || 0,
        mouseCount: payload[0]?.mouseData?.length || 0
      }
    });

    try {
      const token = localStorage.getItem('jwt_token');
      
      // Temporarily pause assessments during training
      const wasTrainingMode = trainingModeRef.current;
      trainingModeRef.current = true;
      console.log('[CBBA Training] ⏸️ Assessments paused during training...');
      
      const response = await fetch(`${API_BASE_URL}/Biometric/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ trainingData: payload })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[CBBA Training] Training successful:', result);
        
        // Clear local training buffer on success
        trainingSamplesRef.current = [];
        setIsTrained(true);
        
        // Clear assessment buffers to prevent immediate false positives
        keystrokeDataRef.current = [];
        mouseDataRef.current = [];
        
        // Reset risk score to 0 after training
        setRiskScore(0);
        setRiskLevel('low');
        setCbbaStatus('active');
        
        console.log('[CBBA Training] ✅ Training complete! Risk reset to 0. Interact normally to establish baseline.');
        
        // Restore training mode to previous state
        trainingModeRef.current = wasTrainingMode;
        if (!wasTrainingMode) {
          console.log('[CBBA Training] ▶️ Assessments resumed.');
        }
        
        return result;
      } else {
        // Restore training mode on error
        trainingModeRef.current = wasTrainingMode;
        
        const err = await response.json();
        console.error('[CBBA Training] Training failed:', err);
        return { success: false, error: err.error || 'Training failed' };
      }
    } catch (error) {
      // Restore training mode on exception
      trainingModeRef.current = wasTrainingMode;
      return { success: false, error: error.message };
    }
  }, [isAuthenticated, user]);

  /**
   * Clear collected data
   */
  const clearData = useCallback(() => {
    keystrokeDataRef.current = [];
    mouseDataRef.current = [];
  }, []);

  /**
   * Reset risk score (for testing after training)
   */
  const resetRiskScore = useCallback(() => {
    setRiskScore(0);
    setRiskLevel('low');
    setCbbaStatus('active');
    keystrokeDataRef.current = [];
    mouseDataRef.current = [];
    console.log('[CBBA] Risk score manually reset to 0. Interact to re-establish baseline.');
  }, []);

  return {
    riskScore,
    riskLevel,
    cbbaStatus,
    isTrained,
    isTraining,
    trainingMode,
    sessionId: sessionId.current,
    trainProfile,
    getProfileStatus,
    collectTrainingData,
    startTrainingCapture,
    stopTrainingCapture,
    trainWithCollectedData,
    clearData,
    resetRiskScore,
    assessRisk
  };
};

export default useCBBA;
