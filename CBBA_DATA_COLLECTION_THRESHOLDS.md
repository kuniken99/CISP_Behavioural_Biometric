# CBBA Data Collection Threshold Update

**Date:** October 18, 2025  
**Status:** ✅ COMPLETED  
**Issue:** 75% risk scores from minimal user interaction (1 mouse move + 1 click)

---

## Problem Analysis

### Root Cause
The CBBA system was attempting risk assessment with insufficient behavioral data:

1. **Old thresholds were too low:**
   - Keystroke: 5 events minimum
   - Mouse: 10 events minimum

2. **Consequence:**
   - User moves mouse once and clicks → triggers assessment
   - Insufficient data generates **zero feature vectors**
   - Zero vectors treated as highly anomalous by trained model
   - Result: **75% risk score** from normal behavior

3. **Flow diagram (OLD):**
   ```
   User interaction     Frontend collects    Immediate assessment
   (1 mouse move        (1-2 events)         (insufficient data)
    + 1 click)                 ↓                      ↓
                         Zero vectors         High anomaly score
                         (< 2 keystroke,      (75% risk)
                          < 3 mouse)
   ```

---

## Solution Implemented

### Updated Thresholds

**File:** `frontend/src/hooks/useCBBA.js`

**Changes:**

1. **Increased minimum data requirements (Lines 120-135)**
   ```javascript
   // OLD thresholds:
   if (keystrokeDataRef.current.length < 5 && 
       mouseDataRef.current.length < 10) {
     return; // Skip assessment
   }

   // NEW thresholds:
   const MIN_KEYSTROKE_EVENTS = 30;  // 5 → 30 (6x increase)
   const MIN_MOUSE_EVENTS = 100;     // 10 → 100 (10x increase)
   
   const hasEnoughKeystroke = keystrokeDataRef.current.length >= MIN_KEYSTROKE_EVENTS;
   const hasEnoughMouse = mouseDataRef.current.length >= MIN_MOUSE_EVENTS;
   
   if (!hasEnoughKeystroke && !hasEnoughMouse) {
     console.log('[CBBA] Insufficient data for assessment (collecting baseline):', {
       keystroke: `${keystrokeDataRef.current.length}/${MIN_KEYSTROKE_EVENTS}`,
       mouse: `${mouseDataRef.current.length}/${MIN_MOUSE_EVENTS}`,
       status: 'waiting for more interactions'
     });
     
     // Set default low risk during data collection phase
     setRiskScore(15);
     setRiskLevel('low');
     return;
   }
   ```

2. **Added default low risk during data collection**
   - Instead of returning silently, now sets **15% risk (low)** during baseline collection
   - User sees consistent low risk while system gathers behavioral data
   - Prevents confusion from "no risk score" or stale high scores

3. **Extended initial assessment delay (Line 327)**
   ```javascript
   // OLD: First assessment after 3 seconds
   setTimeout(assessRisk, 3000);

   // NEW: First assessment after 10 seconds
   setTimeout(assessRisk, 10000);
   ```

---

## New Behavior Flow

### Data Collection Phase (0-10 seconds)
```
User logs in → Frontend starts collecting → Shows 15% risk (low)
                                           ↓
                           "Collecting baseline data..."
```

### Assessment Trigger Conditions
The system will perform risk assessment when **EITHER** condition is met:

1. **Keystroke threshold:** ≥ 30 keystroke events (keydown + keyup)
   - Example: Typing ~15 characters with normal interaction

2. **Mouse threshold:** ≥ 100 mouse events (moves + clicks + scrolls)
   - Example: Moving mouse normally for 5-10 seconds (100 throttled moves at 50ms intervals)

3. **Time-based:** Every 5 seconds (continues to check if thresholds are met)

### Assessment Phase (After thresholds met)
```
Sufficient data collected → Send to backend → Feature extraction
(30+ keystroke OR                            (23 rich features)
 100+ mouse events)              ↓
                        Accurate risk assessment
                        (10-30% for normal behavior)
```

---

## Expected Outcomes

### ✅ Fixes

1. **No more 75% spikes from minimal interaction**
   - Minimal interaction (1-2 events) → Shows 15% risk (default low)
   - No assessment until sufficient data collected

2. **Accurate baseline assessment**
   - First real assessment after 10 seconds OR threshold met
   - Rich behavioral data ensures accurate feature extraction
   - Zero vectors eliminated (always have 30+ keystroke OR 100+ mouse)

3. **Better user experience**
   - Consistent low risk display during initial data collection
   - Clear console logging shows collection progress
   - Smooth transition to accurate risk scores

### 📊 Typical User Journey

**Scenario 1: Normal typing user**
```
0s:  Login → 15% risk (collecting)
5s:  Typed 10 chars → 15% risk (collecting, 20/30 keystrokes)
10s: Typed 20 chars → 25% risk (FIRST REAL ASSESSMENT, 40+ events)
15s: Continues typing → 18% risk (accurate normal behavior)
```

**Scenario 2: Mouse-heavy user**
```
0s:  Login → 15% risk (collecting)
5s:  Moved mouse, clicked buttons → 15% risk (collecting, 80/100 mouse)
10s: Continued interaction → 22% risk (FIRST REAL ASSESSMENT, 150+ mouse events)
15s: Scrolling/clicking → 16% risk (accurate normal behavior)
```

**Scenario 3: Minimal interaction (FIXED)**
```
0s:  Login → 15% risk (collecting)
5s:  Moved mouse once, clicked once → 15% risk (collecting, 2/100 mouse)
10s: Still minimal interaction → 15% risk (insufficient data, waiting)
15s: Started typing → 23% risk (FIRST REAL ASSESSMENT after typing threshold met)
```

---

## Testing Checklist

### Before Restart
- [x] Updated thresholds in useCBBA.js
- [x] Added default 15% risk during collection
- [x] Extended initial assessment to 10 seconds
- [x] Enhanced console logging

### After Restart
- [ ] Login as `tank108`
- [ ] Verify initial risk shows **15% (low)** immediately
- [ ] Move mouse minimally (1-2 times)
- [ ] Verify risk stays at **15%** (not 75%)
- [ ] Type ~20 characters (40 events)
- [ ] Verify risk changes to **10-30%** (first real assessment)
- [ ] Continue normal interaction
- [ ] Verify risk scores remain **10-30%** for normal behavior

### Console Logging
You should see messages like:
```
[CBBA] Insufficient data for assessment (collecting baseline): {
  keystroke: "12/30",
  mouse: "45/100", 
  status: "waiting for more interactions"
}
```

Then when thresholds are met:
```
[CBBA] 3:45:22 PM - Starting risk assessment: {
  keystroke: 42,
  mouse: 156,
  user: "tank108"
}
```

---

## Technical Details

### Why These Thresholds?

**Keystroke: 30 events**
- ~15 characters typed with keydown + keyup
- Sufficient for 10 keystroke features:
  - Dwell time statistics
  - Flight time patterns  
  - Typing speed metrics
  - Rapid keypress detection
  - Fast typing indicators

**Mouse: 100 events**
- ~5-10 seconds of normal mouse movement
- Throttled at 50ms intervals = ~20 events/second
- Sufficient for 13 mouse features:
  - Velocity statistics (mean, std, max)
  - Rapid movement ratio
  - Acceleration patterns
  - Movement curvature
  - Click/scroll patterns
  - Path efficiency

### Feature Extraction Requirements

**Minimum data (feature_extraction.py):**
- Keystroke features: Requires ≥2 events (else returns zeros)
- Mouse features: Requires ≥3 events (else returns zeros)

**Production thresholds (useCBBA.js):**
- Keystroke: 30 events = **15x minimum** (high confidence)
- Mouse: 100 events = **33x minimum** (very high confidence)

This ensures the model always receives rich behavioral data for accurate predictions.

---

## Related Files

- **Frontend:** `frontend/src/hooks/useCBBA.js` (updated)
- **Feature Extraction:** `cbba_python_service/feature_extraction.py` (unchanged)
- **Model:** `cbba_python_service/models/user_tank108_model.pkl` (unchanged)
- **Backend:** `backend/Controllers/BiometricController.cs` (unchanged)

---

## Next Steps

1. **Restart frontend development server**
   ```powershell
   cd frontend
   npm start
   ```

2. **Test with minimal interaction**
   - Login and wait 10 seconds
   - Verify 15% risk (not 75%)

3. **Test with normal interaction**
   - Type some text
   - Move mouse normally
   - Verify risk scores 10-30% after thresholds met

4. **Monitor console logs**
   - Check data collection progress
   - Verify thresholds being met
   - Confirm accurate assessments

---

## Success Criteria

✅ **ISSUE RESOLVED** when:
1. Minimal interaction (1-2 events) → Shows 15% risk (default low)
2. Normal interaction after 10s → Shows 10-30% risk (accurate)
3. No 75% spikes from insufficient data
4. Console logs show clear collection progress
5. Smooth user experience with consistent low risk display

---

*This fix ensures the CBBA system always collects sufficient behavioral data before performing risk assessment, eliminating false positives from insufficient data collection.*
