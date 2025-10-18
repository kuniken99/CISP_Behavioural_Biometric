# CBBA Context Fix - Risk Score Stuck at 0%

## Problem Description
After implementing the CBBAContext to fix the page refresh issue, the risk score was stuck at 0% and not updating properly.

## Root Causes Identified

### Issue 1: Duplicate useAuth() Call
**Location**: `frontend/src/context/CBBAContext.js`

**Problem**: The CBBAProvider was calling `useAuth()` internally even though `isAuthenticated` and `currentUser` were being passed as props from App.js. This created two separate instances of the auth state, causing authentication mismatches.

**Code Before**:
```javascript
export const CBBAProvider = ({ children, onRiskDetected }) => {
  const { isAuthenticated, currentUser } = useAuth(); // ❌ Wrong - creates new auth instance
  const cbbaState = useCBBA(isAuthenticated, currentUser, onRiskDetected);
  ...
}
```

**Fix**: Use the props passed from App.js instead of creating a new auth instance:
```javascript
export const CBBAProvider = ({ children, isAuthenticated, currentUser, onRiskDetected }) => {
  const cbbaState = useCBBA(isAuthenticated, currentUser, onRiskDetected); // ✅ Uses parent auth state
  ...
}
```

### Issue 2: Stale Closure in assessRisk Function
**Location**: `frontend/src/hooks/useCBBA.js`

**Problem**: The `assessRisk` callback included state values (`riskScore`, `riskLevel`, `cbbaStatus`, `isTrained`) in its dependency array. This caused the function to have stale closure values and prevented proper state updates.

**Code Before**:
```javascript
const assessRisk = useCallback(async () => {
  // ... assessment logic
  
  // ❌ Comparing against stale values
  if (newRiskScore !== riskScore) {
    setRiskScore(newRiskScore);
  }
  if (newRiskLevel !== riskLevel) {
    setRiskLevel(newRiskLevel);
  }
}, [isAuthenticated, user, onRiskDetected, riskScore, riskLevel, cbbaStatus, isTrained]);
// ❌ State values in dependency array cause stale closures
```

**Fix**: Use functional setState updates to avoid closure issues and remove state from dependencies:
```javascript
const assessRisk = useCallback(async () => {
  // ... assessment logic
  
  // ✅ Functional updates with previous state
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
}, [isAuthenticated, user, onRiskDetected]);
// ✅ Only dependencies that don't change during execution
```

## Changes Made

### 1. CBBAContext.js
- **Removed**: `import useAuth from '../hooks/useAuth';`
- **Updated**: `CBBAProvider` to accept `isAuthenticated` and `currentUser` as props
- **Result**: Provider now uses the same auth state as the rest of the app

### 2. useCBBA.js
- **Updated**: `assessRisk` callback to use functional setState updates
- **Removed**: State values from dependency array
- **Added**: Detailed console logs for debugging state updates
- **Result**: State updates work correctly without stale closures

## How It Works Now

### Component Hierarchy
```
App.js
  ├─ useAuth() ← Single source of truth for auth
  │
  └─ CBBAProvider (receives auth state as props)
      ├─ useCBBA(isAuthenticated, currentUser, onRiskDetected)
      │   ├─ Event listeners (keydown, mousemove, etc.)
      │   ├─ Data collection (every interaction)
      │   └─ Risk assessment (every 15 seconds)
      │
      └─ Context provides state to children
          └─ DashboardLayout
              └─ useCBBAContext() ← Gets CBBA state
                  └─ CBBAMonitor displays risk score ✅
```

### State Update Flow
1. User interacts (keyboard/mouse) → Events captured
2. Every 15 seconds → `assessRisk()` called
3. POST to `/Biometric/assess` with behavioral data
4. Backend/Python returns risk score
5. **Functional setState** updates state correctly
6. Only CBBA consumers re-render (not entire app)
7. CBBAMonitor displays updated risk score ✅

## Benefits of the Fix

1. ✅ **Risk Scores Work**: Properly updates from 0% to actual calculated values
2. ✅ **Correct Auth State**: Uses single auth instance from App.js
3. ✅ **No Stale Closures**: Functional updates prevent closure issues
4. ✅ **Better Debugging**: Console logs show state transitions
5. ✅ **No Page Refresh Bug**: Context isolation still works

## Console Output Examples

When working correctly, you should see these logs in the browser console:

```javascript
[CBBA] Assessing risk with data: {
  keystroke: 45,
  mouse: 230,
  user: "tank108"
}

[CBBA] Risk assessment result: {
  riskScore: 15.5,
  riskLevel: "green",
  status: "Active",
  action: "none",
  isTrained: true
}

[CBBA] Risk score updated: 0 → 15.5
[CBBA] Risk level updated: low → green
```

## Testing Verification

To verify the fix is working:

1. **Login** as tank108
2. **Open Browser Console** (F12)
3. **Interact** with the page (type, move mouse)
4. **Wait 5 seconds** for initial assessment
5. **Check console** for assessment logs
6. **Verify CBBAMonitor** shows non-zero risk score
7. **Wait 15 seconds** for next assessment
8. **Confirm** risk score updates in real-time

### Expected Behavior
- ✅ Risk score shows actual percentage (not stuck at 0%)
- ✅ Risk level shows correct color (green/orange/red)
- ✅ Console shows "Risk score updated" logs
- ✅ User inputs still don't reset (context isolation working)
- ✅ No errors in console

### Troubleshooting

If risk score is still 0%:

1. **Check all services running**:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000
   - Python: http://localhost:5001

2. **Check console for errors**:
   - Network errors → Backend/Python not running
   - "Insufficient data" → Need to interact more
   - "Not authenticated" → Login issue

3. **Verify backend can reach Python**:
   - Backend should call `http://localhost:5001/assess`
   - Check Python service logs for incoming requests

4. **Check BiometricProfile exists**:
   - User needs a profile in database
   - Profile should be trained (IsTrained = true)
   - Can manually train via CBBA training endpoint

## Related Files

- `frontend/src/context/CBBAContext.js` - CBBA Context Provider
- `frontend/src/hooks/useCBBA.js` - CBBA hook with behavioral tracking
- `frontend/src/App.js` - Main app with CBBAProvider integration
- `frontend/src/components/CBBAMonitor.js` - Risk score display
- `backend/Controllers/BiometricController.cs` - Assessment endpoint
- `cbba_python_service/app.py` - Python ML service

## Summary

The risk score was stuck at 0% due to:
1. Duplicate auth instances causing authentication mismatch
2. Stale closures in assessRisk preventing state updates

Both issues have been fixed by:
1. Using props for auth state in CBBAProvider
2. Using functional setState updates in useCBBA

**Status**: ✅ FIXED - Risk scores now update correctly in real-time
