# Frontend CBBA Integration Fix

## Issue
Frontend was stuck showing 12% risk score because:
1. Old `useBiometricTracking` hook was disabled
2. Hardcoded value of 12 was being displayed
3. New `useCBBA` hook was not integrated into App.js

## Changes Made

### 1. **App.js** - Integrated New CBBA System
**File**: `frontend/src/App.js`

#### Changes:
- ✅ Replaced `useBiometricTracking` with `useCBBA`
- ✅ Added `StepUpAuth` and `SessionLock` components
- ✅ Added risk detection handler
- ✅ Connected CBBAMonitor to real risk data

**Before**:
```javascript
import useBiometricTracking from './hooks/useBiometricTracking';
// const { cbbaStatus, lastCbbaScore, sessionId } = useBiometricTracking(isAuthenticated, handleLogout);
const cbbaStatus = "CBBA: Disabled for debugging";
const lastCbbaScore = 0;

<CBBAMonitor 
  status="Active" 
  riskScore={12}  // Hardcoded!
  isAuthenticated={isAuthenticated}
/>
```

**After**:
```javascript
import useCBBA from './hooks/useCBBA';
import StepUpAuth from './components/security/StepUpAuth';
import SessionLock from './components/security/SessionLock';

const {
  riskScore,
  riskLevel,
  cbbaStatus,
  isTrained,
  isTraining
} = useCBBA(isAuthenticated, currentUser, handleRiskDetected);

<CBBAMonitor 
  status={cbbaStatus}
  riskScore={riskScore}  // Real-time from CBBA!
  riskLevel={riskLevel}
  isAuthenticated={isAuthenticated}
/>
```

### 2. **useCBBA.js** - Added Debug Logging
**File**: `frontend/src/hooks/useCBBA.js`

Added console logging to track:
- Data collection (keystroke/mouse events)
- Risk assessment requests
- Risk assessment results
- Actions triggered (challenge/lock)

**New Logs**:
```javascript
console.log('[CBBA] Assessing risk with data:', { keystroke, mouse, user });
console.log('[CBBA] Risk assessment result:', { riskScore, riskLevel, status, action });
console.log('[CBBA] Triggering step-up authentication challenge');
console.log('[CBBA] Triggering session lock');
```

### 3. **CBBAMonitor.js** - Updated Shield Icon Filter
**File**: `frontend/src/components/CBBAMonitor.js`

Updated shield icon color filter to match new thresholds:
- **Before**: Green filter for riskScore <= 20
- **After**: Green filter for riskScore < 50

## Risk Level Thresholds (Confirmed)

### Colors and Actions:
1. **Green (0-49%)**
   - Status: "Normal - Low Risk"
   - Background: #D1FAE5 (light green)
   - Bar: #10B981 (green)
   - Action: None

2. **Orange (50-79%)**
   - Status: "Suspicious - Moderate Risk"
   - Background: #FED7AA (light orange)
   - Bar: #F97316 (orange)
   - Action: Step-up authentication challenge

3. **Red (80-100%)**
   - Status: "Anomalous - High Risk"
   - Background: #FEE2E2 (light red)
   - Bar: #EF4444 (red)
   - Action: Session lock

## Testing Steps

### 1. Start All Services

**Terminal 1 - Python Service**:
```powershell
cd cbba_python_service
python app.py
```
Expected: Service running on http://127.0.0.1:5001

**Terminal 2 - Backend**:
```powershell
cd backend
dotnet run
```
Expected: Service running on https://localhost:7240

**Terminal 3 - Frontend**:
```powershell
cd frontend
npm start
```
Expected: React app running on http://localhost:3000

### 2. Test CBBA Monitoring

1. **Login** as user `tank108` (trained user)
2. **Open Browser Console** (F12 → Console tab)
3. **Look for CBBA logs**:
   ```
   [CBBA] Assessing risk with data: {keystroke: 15, mouse: 45, user: "tank108"}
   [CBBA] Risk assessment result: {riskScore: 25, riskLevel: "low", ...}
   ```

4. **Observe CBBAMonitor**:
   - Risk score should update in real-time
   - Color should change based on score
   - Progress bar should animate

### 3. Test Different Scenarios

#### Normal Behavior (Green):
- Type normally
- Move mouse naturally
- Expected: 0-49% risk score, green color

#### Moderate Anomaly (Orange):
- Type very fast/slow
- Move mouse erratically
- Expected: 50-79% risk score, orange color, step-up auth popup

#### High Anomaly (Red):
- Extreme typing speed changes
- Random mouse movements
- Expected: 80-100% risk score, red color, session lock

## Troubleshooting

### Risk Score Not Updating?

**Check**:
1. Backend is running and connected to Python service
2. User is trained (run `train_user.py` first)
3. Browser console shows CBBA logs
4. Network tab shows `/api/Biometric/assess` requests

**Common Issues**:
- **"Insufficient data"**: Wait longer, type more, move mouse
- **"Not trained"**: Run `python train_user.py` for the user
- **"Network error"**: Check backend/Python service are running

### Still Showing 12%?

1. **Hard refresh browser**: Ctrl+Shift+R (clears cache)
2. **Check user is logged in**: Console should show username
3. **Verify user was trained with correct username**: 
   - Check `models/user_tank108_model.pkl` exists
   - Username must match exactly (case-sensitive)

### Risk Score Too Low/High?

**Retrain the model**:
```powershell
cd cbba_python_service
python train_user.py
```
Enter your username (e.g., tank108)

## Files Modified Summary

✅ **frontend/src/App.js** - Integrated useCBBA hook
✅ **frontend/src/hooks/useCBBA.js** - Added debug logging
✅ **frontend/src/components/CBBAMonitor.js** - Updated shield icon filter

## Expected Behavior

### On Page Load:
1. useCBBA hook initializes
2. Event listeners attached (keydown, keyup, mousemove, click, scroll)
3. Data collection begins
4. Assessment every 30 seconds

### During Session:
1. Keystroke events captured → stored in array
2. Mouse events captured → stored in array
3. Every 30 seconds:
   - Send data to `/api/Biometric/assess`
   - Receive risk score
   - Update CBBAMonitor display
   - Trigger actions if needed

### Risk Detection:
- **50-79%**: StepUpAuth dialog appears
- **80-100%**: SessionLock screen appears

---

**Status**: ✅ Ready for Testing
**Date**: October 18, 2025
